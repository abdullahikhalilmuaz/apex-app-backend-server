const mongoose = require("mongoose");

const MessageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Conversation",
    },
    senderId: { type: mongoose.Schema.Types.ObjectId, required: true },
    senderRole: { type: String, required: true },
    senderName: { type: String, default: "" },
    content: { type: String, required: true, trim: true },
    readBy: [{ type: mongoose.Schema.Types.ObjectId }],
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "messages" }
);

MessageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model("Message", MessageSchema);