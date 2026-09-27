const mongoose = require("mongoose");

const MessagingUserSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
    role: {
      type: String,
      enum: ["headmaster", "teacher", "parent"],
      required: true,
    },
    name: { type: String, default: "" },
    email: { type: String, default: "" },
    lastSeen: { type: Date, default: Date.now },
  },
  { collection: "messaging_users" }
);

MessagingUserSchema.index({ role: 1 });

module.exports = mongoose.model("MessagingUser", MessagingUserSchema);