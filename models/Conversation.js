const mongoose = require("mongoose");

const ParticipantSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: { type: String, required: true },
    name: { type: String, default: "" },
  },
  { _id: false }
);

const ConversationSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["direct", "group"],
      required: true,
    },
    name: { type: String, default: "" }, // for groups
    key: { type: String, unique: true, required: true }, // unique identifier
    participants: [ParticipantSchema],

    lastMessage: { type: String, default: "" },
    lastMessageAt: { type: Date, default: null },
    lastMessageSenderId: { type: mongoose.Schema.Types.ObjectId, default: null },
    lastMessageSenderName: { type: String, default: "" },

    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "conversations" }
);

ConversationSchema.index({ "participants.userId": 1, lastMessageAt: -1 });

module.exports = mongoose.model("Conversation", ConversationSchema);