const mongoose = require("mongoose");

const AttendanceSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    class: { type: String, required: true },
    date: { type: Date, required: true },
    status: {
      type: String,
      enum: ["present", "absent", "late", "excused"],
      required: true,
    },
    markedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    notes: String,
  },
  { collection: "attendance_records" },
);

AttendanceSchema.index({ studentId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendance", AttendanceSchema);
