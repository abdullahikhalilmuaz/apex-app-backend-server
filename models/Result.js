const mongoose = require("mongoose");

const SubjectScoreSchema = new mongoose.Schema({
  subject: { type: String, required: true },
  ca: { type: Number, default: 0, min: 0, max: 40 },
  exam: { type: Number, default: 0, min: 0, max: 60 },
  total: { type: Number, default: 0 }, // ca + exam, computed
  grade: { type: String, default: "" }, // A/B/C/etc — computed
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
    session: { type: String, required: true }, // e.g. "2024/2025"
    subjects: [SubjectScoreSchema],
    totalScore: { type: Number, default: 0 },
    average: { type: Number, default: 0 },
    position: { type: Number, default: 0 },
    outOf: { type: Number, default: 0 }, // class size
    attendanceSummary: {
      present: { type: Number, default: 0 },
      absent: { type: Number, default: 0 },
      total: { type: Number, default: 0 },
    },
    publishedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    publishedAt: { type: Date, default: Date.now },
  },
  { collection: "results" },
);

ResultSchema.index({ studentId: 1, term: 1, session: 1 }, { unique: true });

module.exports = mongoose.model("Result", ResultSchema);
