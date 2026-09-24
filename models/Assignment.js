const mongoose = require("mongoose");

const AssignmentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, default: "" },
    class: { type: String, required: true },
    subject: { type: String, default: "" }, // "" means no subject → all subjects
    topic: { type: String, default: "" },
    dueDate: Date,
    teacherId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    teacherName: String,
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "assignments" },
);

AssignmentSchema.index({ class: 1, createdAt: -1 });

module.exports = mongoose.model("Assignment", AssignmentSchema);
