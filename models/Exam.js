const mongoose = require("mongoose");

const ObjectiveSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  options: { type: [String], default: ["", "", "", ""] },
  correct: { type: String, default: "" }, // "A" | "B" | "C" | "D"
});

const EssaySchema = new mongoose.Schema({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  marks: { type: Number, default: 5 },
});

const FillBlankSchema = new mongoose.Schema({
  number: { type: Number, required: true },
  text: { type: String, required: true },
  answer: { type: String, default: "" },
});

const ExamSchema = new mongoose.Schema(
  {
    title: { type: String, default: "" },
    class: { type: String, required: true },
    subject: { type: String, required: true },
    term: {
      type: String,
      enum: ["First", "Second", "Third"],
      required: true,
    },
    session: { type: String, required: true },
    duration: { type: String, default: "2 hours" },
    totalMarks: { type: Number, default: 100 },
    instructions: { type: String, default: "" },

    objectives: [ObjectiveSchema],
    essays: [EssaySchema],
    fillBlanks: [FillBlankSchema],

    status: {
      type: String,
      enum: ["draft", "submitted", "reviewed"],
      default: "draft",
    },

    teacherId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    teacherName: String,
    submittedAt: Date,
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
  },
  { collection: "exams" },
);

ExamSchema.index({ class: 1, term: 1, session: 1 });
ExamSchema.index({ teacherId: 1 });
ExamSchema.index(
  { class: 1, subject: 1, term: 1, session: 1 },
  { unique: true },
);

module.exports = mongoose.model("Exam", ExamSchema);
