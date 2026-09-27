const mongoose = require("mongoose");

const PushTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, required: true },
    role: {
      type: String,
      enum: ["headmaster", "teacher", "parent"],
      required: true,
    },
    token: { type: String, required: true, unique: true },
    device: { type: String, default: "unknown" },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "push_tokens" },
);

PushTokenSchema.index({ userId: 1 });
PushTokenSchema.index({ role: 1 });

module.exports = mongoose.model("PushToken", PushTokenSchema);
