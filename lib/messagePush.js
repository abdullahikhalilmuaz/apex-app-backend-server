const axios = require("axios");
const PushToken = require("../models/PushToken");
const MessagingUser = require("../models/MessagingUser");

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

async function sendMessagePush({
  toUserIds,
  excludeUserId,
  conversationId,
  senderName,
  content,
}) {
  try {
    const ids = toUserIds.filter((id) => String(id) !== String(excludeUserId));
    if (ids.length === 0) return;

    const tokens = await PushToken.find({ userId: { $in: ids } });
    if (tokens.length === 0) return;

    const preview =
      content.length > 80 ? content.slice(0, 80) + "…" : content;

    const messages = tokens.map((t) => ({
      to: t.token,
      sound: "default",
      title: senderName || "New message",
      body: preview,
      data: {
        type: "message",
        conversationId,
      },
    }));

    // Chunk of 100
    for (let i = 0; i < messages.length; i += 100) {
      await axios.post(EXPO_PUSH_URL, messages.slice(i, i + 100), {
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });
    }
  } catch (err) {
    console.error("sendMessagePush error:", err.message);
  }
}

module.exports = { sendMessagePush };