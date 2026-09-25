const mongoose = require("mongoose");

const SubjectScoreSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  ca1: { type: Number, default: 0, min: 0, max: 10 },
  ca2: { type: Number, default: 0, min: 0, max: 10 },
  ca3: { type: Number, default: 0, min: 0, max: 10 },
  exam: { type: Number, default: 0, min: 0, max: 70 },
  total: { type: Number, default: 0 },
  grade: { type: String, default: "" },
  teacherRemark: { type: String, default: "" },
});

const ResultSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    class: { type: String, required: true },
    term: {
      type: String,
      enum: ["First", "Second", "Third"],
      required: true,
    },
    session: { type: String, required: true },
    subjects: [SubjectScoreSchema],
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    outOf: { type: Number, default: 0 },
    attendanceSummary: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    classTeacherRemark: { type: String, default: "" },
    headmasterRemark: { type: String, default: "" },
    nextTermBegins: { type: String, default: "" },
    nextTermFees: { type: String, default: "" },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date, default: Date.now },
  },
  { collection: "results" },
);

ResultSchema.index({ studentId: 1, term: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Result", ResultSchema);
