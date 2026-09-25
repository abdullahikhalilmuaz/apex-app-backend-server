const Exam = require("../models/Exam");

// POST /api/app/exams — create or update (upsert by class+subject+term+session)
exports.saveExam = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can create exams" });
    }
    const {
      title,
      class: className,
      subject,
      term,
      session,
      duration,
      totalMarks,
      instructions,
      objectives,
      essays,
      fillBlanks,
      submit, // boolean — if true, marks as submitted for review
    } = req.body;

    if (!className || !subject || !term || !session) {
      return res
        .status(400)
        .json({ error: "class, subject, term, session required" });
    }

    const existing = await Exam.findOne({
      class: className,
      subject,
      term,
      session,
    });

    // If exists and belongs to a different teacher — forbid
    if (existing && String(existing.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Another teacher owns this exam" });
    }

    const payload = {
      title: title || `${subject} — ${term} Term Examination`,
      class: className,
      subject,
      term,
      session,
      duration: duration || "2 hours",
      totalMarks: totalMarks || 100,
      instructions: instructions || "",
      objectives: objectives || [],
      essays: essays || [],
      fillBlanks: fillBlanks || [],
      teacherId: req.user.id,
      teacherName: req.user.name || "Teacher",
      status: submit ? "submitted" : existing?.status || "draft",
      submittedAt: submit ? new Date() : existing?.submittedAt,
      updatedAt: new Date(),
    };

    const exam = await Exam.findOneAndUpdate(
      { class: className, subject, term, session },
      payload,
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );

    res.json({ message: "Exam saved", exam });
  } catch (err) {
    console.error("saveExam error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/exams/teacher — teacher's own exams
exports.getTeacherExams = async (req, res) => {
  try {
    const exams = await Exam.find({ teacherId: req.user.id })
      .sort({ updatedAt: -1 })
      .select(
        "title class subject term session status totalMarks duration updatedAt objectives essays fillBlanks",
      );
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/exams/class/:className — headmaster view (all submitted exams for class)
exports.getClassExams = async (req, res) => {
  try {
    const exams = await Exam.find({
      class: req.params.className,
      status: { $in: ["submitted", "reviewed"] },
    }).sort({ subject: 1 });
    res.json(exams);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/exams/:id — full exam (teacher owner OR headmaster)
exports.getExam = async (req, res) => {
  try {
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Exam not found" });

    if (req.user.role === "teacher") {
      if (String(exam.teacherId) !== String(req.user.id)) {
        return res.status(403).json({ error: "Not your exam" });
      }
    } else if (req.user.role !== "headmaster") {
      return res.status(403).json({ error: "Not allowed" });
    }

    res.json(exam);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/app/exams/:id — teacher deletes own
exports.deleteExam = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can delete" });
    }
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Not found" });
    if (String(exam.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not your exam" });
    }
    await Exam.findByIdAndDelete(req.params.id);
    res.json({ message: "Exam deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// POST /api/app/exams/:id/submit — teacher submits for review
exports.submitExam = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can submit" });
    }
    const exam = await Exam.findById(req.params.id);
    if (!exam) return res.status(404).json({ error: "Not found" });
    if (String(exam.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: "Not your exam" });
    }
    exam.status = "submitted";
    exam.submittedAt = new Date();
    await exam.save();
    res.json({ message: "Submitted for review", exam });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
