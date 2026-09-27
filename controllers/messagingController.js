const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const MessagingUser = require("../models/MessagingUser");
const { getIO } = require("../lib/socket");
const { sendMessagePush } = require("../lib/messagePush");

const TEACHERS_GROUP_KEY = "group:teachers-discussion";
const TEACHERS_GROUP_NAME = "Teachers Discussion";

// ─── Sync current user into MessagingUser ───
exports.syncMe = async (req, res) => {
  try {
    const { name, email } = req.body;
    const user = await MessagingUser.findOneAndUpdate(
      { userId: req.user.id },
      {
        userId: req.user.id,
        role: req.user.role,
        name: name || "",
        email: email || "",
        lastSeen: new Date(),
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get possible recipients for current role ───
exports.getRecipients = async (req, res) => {
  try {
    const role = req.user.role;
    let filter = {};

    if (role === "teacher" || role === "parent") {
      // Can message headmasters
      filter = { role: "headmaster" };
    } else if (role === "headmaster") {
      // Can message teachers + parents
      filter = { role: { $in: ["teacher", "parent"] } };
    } else {
      return res.json([]);
    }

    const users = await MessagingUser.find(filter)
      .select("userId role name email")
      .sort({ name: 1 });

    // Exclude self
    const result = users
      .filter((u) => String(u.userId) !== String(req.user.id))
      .map((u) => ({
        id: u.userId,
        role: u.role,
        name: u.name || u.email || "User",
        label:
          u.role === "headmaster"
            ? `Headmaster · ${u.name}`
            : u.role === "teacher"
              ? `Teacher · ${u.name}`
              : `Parent · ${u.name}`,
      }));

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Ensure teachers discussion group exists ───
async function ensureTeachersGroup() {
  let conv = await Conversation.findOne({ key: TEACHERS_GROUP_KEY });
  if (!conv) {
    conv = await Conversation.create({
      type: "group",
      name: TEACHERS_GROUP_NAME,
      key: TEACHERS_GROUP_KEY,
      participants: [], // participants derived by role at read-time
    });
  }
  return conv;
}

// ─── List conversations for current user ───
exports.getConversations = async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;

    let list = await Conversation.find({
      "participants.userId": userId,
    }).sort({ lastMessageAt: -1, updatedAt: -1 });

    // Teachers & headmasters also see the teachers group
    if (role === "teacher" || role === "headmaster") {
      const group = await ensureTeachersGroup();
      if (!list.find((c) => c.key === TEACHERS_GROUP_KEY)) {
        list.unshift(group);
      }
    }

    const shaped = list.map((c) => {
      const others = c.participants.filter(
        (p) => String(p.userId) !== String(userId),
      );
      const displayName =
        c.type === "group"
          ? c.name
          : others[0]?.name || c.name || "Conversation";

      return {
        _id: c._id,
        type: c.type,
        name: displayName,
        key: c.key,
        participantRole: c.type === "direct" ? others[0]?.role : "group",
        lastMessage: c.lastMessage,
        lastMessageAt: c.lastMessageAt,
        lastMessageSenderName: c.lastMessageSenderName,
      };
    });

    res.json(shaped);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Get messages in a conversation ───
exports.getMessages = async (req, res) => {
  try {
    const { id } = req.params;
    const conv = await Conversation.findById(id);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    // Access check
    const isParticipant = conv.participants.some(
      (p) => String(p.userId) === String(req.user.id),
    );
    const isTeachersGroup =
      conv.key === TEACHERS_GROUP_KEY &&
      (req.user.role === "teacher" || req.user.role === "headmaster");
    if (!isParticipant && !isTeachersGroup) {
      return res.status(403).json({ error: "Not a participant" });
    }

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .limit(500);

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Start or find a direct conversation ───
exports.startDirect = async (req, res) => {
  try {
    const { toUserId } = req.body;
    if (!toUserId) return res.status(400).json({ error: "toUserId required" });
    if (String(toUserId) === String(req.user.id)) {
      return res.status(400).json({ error: "Cannot message yourself" });
    }

    const me = await MessagingUser.findOne({ userId: req.user.id });
    const them = await MessagingUser.findOne({ userId: toUserId });
    if (!me || !them) {
      return res.status(404).json({
        error:
          "User not registered in messaging. They must open Messages once.",
      });
    }

    const ids = [String(req.user.id), String(toUserId)].sort();
    const key = `direct:${ids[0]}:${ids[1]}`;

    let conv = await Conversation.findOne({ key });
    if (!conv) {
      conv = await Conversation.create({
        type: "direct",
        key,
        participants: [
          { userId: req.user.id, role: req.user.role, name: me.name },
          { userId: toUserId, role: them.role, name: them.name },
        ],
      });
    }

    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ─── Send message ───
exports.sendMessage = async (req, res) => {
  try {
    const { conversationId, content } = req.body;
    if (!conversationId || !content?.trim()) {
      return res
        .status(400)
        .json({ error: "conversationId and content required" });
    }

    const conv = await Conversation.findById(conversationId);
    if (!conv) return res.status(404).json({ error: "Conversation not found" });

    const isParticipant = conv.participants.some(
      (p) => String(p.userId) === String(req.user.id),
    );
    const isTeachersGroup =
      conv.key === TEACHERS_GROUP_KEY &&
      (req.user.role === "teacher" || req.user.role === "headmaster");

    if (!isParticipant && !isTeachersGroup) {
      return res.status(403).json({ error: "Not allowed" });
    }

    const me = await MessagingUser.findOne({ userId: req.user.id });

    const message = await Message.create({
      conversationId,
      senderId: req.user.id,
      senderRole: req.user.role,
      senderName: me?.name || req.user.name || "",
      content: content.trim(),
      readBy: [req.user.id],
    });

    // Update conversation
    conv.lastMessage = content.trim();
    conv.lastMessageAt = new Date();
    conv.lastMessageSenderId = req.user.id;
    conv.lastMessageSenderName = me?.name || "";
    conv.updatedAt = new Date();
    await conv.save();

    // ─── Live delivery via Socket.IO ───
    const io = getIO();
    const payload = {
      ...message.toObject(),
      conversationId,
    };

    if (conv.type === "group" && conv.key === TEACHERS_GROUP_KEY) {
      io.to("group:teachers").emit("new-message", payload);
    } else {
      conv.participants.forEach((p) => {
        io.to(`user:${p.userId}`).emit("new-message", payload);
      });
    }

    // ─── Push notification ───
    let recipients = [];
    if (conv.type === "group" && conv.key === TEACHERS_GROUP_KEY) {
      const others = await MessagingUser.find({
        role: { $in: ["teacher", "headmaster"] },
      });
      recipients = others.map((u) => u.userId);
    } else {
      recipients = conv.participants.map((p) => p.userId);
    }

    const pushTitle =
      conv.type === "group"
        ? `${me?.name || "User"} · ${conv.name}`
        : `${me?.name || "User"} · ${me?.role === "parent" ? "Parent" : me?.role === "teacher" ? "Teacher" : "Headmaster"}`;

    sendMessagePush({
      toUserIds: recipients,
      excludeUserId: req.user.id,
      conversationId,
      senderName: pushTitle,
      content: content.trim(),
    }).catch(() => {});

    res.status(201).json(message);
  } catch (err) {
    console.error("sendMessage error:", err);
    res.status(500).json({ error: err.message });
  }
};

// ─── Start teachers group explicitly ───
exports.openTeachersGroup = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "headmaster") {
      return res.status(403).json({ error: "Teachers only" });
    }
    const conv = await ensureTeachersGroup();
    res.json(conv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
