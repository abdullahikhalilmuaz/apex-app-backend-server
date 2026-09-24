const Result = require("../models/Result");
const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

function computeGrade(total) {
  if (total >= 70) return "A";
  if (total >= 60) return "B";
  if (total >= 50) return "C";
  if (total >= 40) return "D";
  return "F";
}

// POST /api/app/results — teacher publishes a full class result
// body: { class, term, session, results: [{ studentId, subjects: [{subject, ca, exam}] }] }
exports.publishResults = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can publish results" });
    }
    const { class: className, term, session, results } = req.body;
    if (!className || !term || !session || !Array.isArray(results)) {
      return res
        .status(400)
        .json({ error: "class, term, session, results required" });
    }

    // Compute totals + grades per student
    const computed = results.map((r) => {
      const subjects = r.subjects.map((s) => {
        const total = (s.ca || 0) + (s.exam || 0);
        return { ...s, total, grade: computeGrade(total) };
      });
      const totalScore = subjects.reduce((sum, s) => sum + s.total, 0);
      const average = subjects.length > 0 ? totalScore / subjects.length : 0;
      return { studentId: r.studentId, subjects, totalScore, average };
    });

    // Rank students by totalScore
    const sorted = [...computed].sort((a, b) => b.totalScore - a.totalScore);
    const classSize = sorted.length;
    const rankMap = new Map();
    sorted.forEach((s, i) => {
      rankMap.set(String(s.studentId), i + 1);
    });

    // Save each student's result
    for (const c of computed) {
      const position = rankMap.get(String(c.studentId)) || 0;

      // Get attendance summary for the term period
      // Simple approach: all attendance for that student (school can extend this)
      const attRecords = await Attendance.find({ studentId: c.studentId });
      const present = attRecords.filter((a) => a.status === "present").length;
      const absent = attRecords.filter((a) => a.status === "absent").length;

      await Result.findOneAndUpdate(
        { studentId: c.studentId, term, session },
        {
          studentId: c.studentId,
          class: className,
          term,
          session,
          subjects: c.subjects,
          totalScore: c.totalScore,
          average: Math.round(c.average * 100) / 100,
          position,
          outOf: classSize,
          attendanceSummary: {
            present,
            absent,
            total: attRecords.length,
          },
          publishedBy: req.user.id,
          publishedAt: new Date(),
        },
        { upsert: true, new: true },
      );
    }

    res.json({ message: "Results published", count: computed.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/student/:id?term=First&session=2024/2025
exports.getStudentResult = async (req, res) => {
  try {
    const { id } = req.params;
    const { term, session } = req.query;
    if (!term || !session) {
      return res.status(400).json({ error: "term and session query required" });
    }
    const result = await Result.findOne({ studentId: id, term, session });
    if (!result) {
      return res
        .status(404)
        .json({ error: "No result found for this term/session" });
    }
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/class/:className?term=First&session=2024/2025
exports.getClassResults = async (req, res) => {
  try {
    const { term, session } = req.query;
    if (!term || !session) {
      return res.status(400).json({ error: "term and session query required" });
    }
    const results = await Result.find({
      class: req.params.className,
      term,
      session,
    })
      .populate("studentId", "firstName middleName lastName")
      .sort({ position: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/student/:id/all — all terms for a session
exports.getStudentHistory = async (req, res) => {
  try {
    const { session } = req.query;
    const query = { studentId: req.params.id };
    if (session) query.session = session;
    const results = await Result.find(query).sort({ session: -1, term: 1 });
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
