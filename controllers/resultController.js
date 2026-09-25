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

function computeTotal(s) {
  const ca1 = s.ca1 || 0;
  const ca2 = s.ca2 || 0;
  const ca3 = s.ca3 || 0;
  const legacyCa = s.ca || 0;
  const hasNewCA = ca1 + ca2 + ca3 > 0;
  const effectiveCa1 = hasNewCA ? ca1 : legacyCa;
  return effectiveCa1 + ca2 + ca3 + (s.exam || 0);
}

// POST /api/app/results — merge semantics
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

    const studentIds = results.map((r) => r.studentId);
    const existingList = await Result.find({
      studentId: { $in: studentIds },
      term,
      session,
    });
    const existingMap = new Map(
      existingList.map((r) => [String(r.studentId), r]),
    );

    const computed = results.map((r) => {
      const existing = existingMap.get(String(r.studentId));

      const subjectMap = new Map();
      if (existing) {
        existing.subjects.forEach((s) => {
          subjectMap.set(s.subject, {
            subject: s.subject,
            ca1: s.ca1 || 0,
            ca2: s.ca2 || 0,
            ca3: s.ca3 || 0,
            exam: s.exam || 0,
            teacherRemark: s.teacherRemark || "",
          });
        });
      }

      r.subjects.forEach((s) => {
        const hasData =
          (s.ca1 || 0) > 0 ||
          (s.ca2 || 0) > 0 ||
          (s.ca3 || 0) > 0 ||
          (s.exam || 0) > 0 ||
          (s.ca || 0) > 0;
        if (hasData) {
          subjectMap.set(s.subject, {
            subject: s.subject,
            ca1: s.ca1 || 0,
            ca2: s.ca2 || 0,
            ca3: s.ca3 || 0,
            exam: s.exam || 0,
            teacherRemark: s.teacherRemark || "",
          });
        }
      });

      const subjects = Array.from(subjectMap.values()).map((s) => {
        const total = computeTotal(s);
        return { ...s, total, grade: computeGrade(total) };
      });

      const totalScore = subjects.reduce((sum, s) => sum + s.total, 0);
      const average = subjects.length > 0 ? totalScore / subjects.length : 0;
      return { studentId: r.studentId, subjects, totalScore, average };
    });

    const sorted = [...computed].sort((a, b) => b.totalScore - a.totalScore);
    const classSize = sorted.length;
    const rankMap = new Map();
    sorted.forEach((s, i) => rankMap.set(String(s.studentId), i + 1));

    for (const c of computed) {
      const position = rankMap.get(String(c.studentId)) || 0;
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
          attendanceSummary: { present, absent, total: attRecords.length },
          publishedBy: req.user.id,
          publishedAt: new Date(),
        },
        { upsert: true, new: true },
      );
    }

    res.json({ message: "Results saved", count: computed.length });
  } catch (err) {
    console.error("publishResults error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/class/:className/stats
exports.getClassStats = async (req, res) => {
  try {
    const { term, session } = req.query;
    if (!term || !session)
      return res.status(400).json({ error: "term and session required" });

    const results = await Result.find({
      class: req.params.className,
      term,
      session,
    });
    if (results.length === 0) {
      return res.json({
        enrollment: 0,
        highestAvg: 0,
        lowestAvg: 0,
        highestTotal: 0,
        lowestTotal: 0,
      });
    }
    const averages = results.map((r) => r.average || 0);
    const totals = results.map((r) => r.totalScore || 0);
    res.json({
      enrollment: results.length,
      highestAvg: Math.round(Math.max(...averages) * 100) / 100,
      lowestAvg: Math.round(Math.min(...averages) * 100) / 100,
      highestTotal: Math.max(...totals),
      lowestTotal: Math.min(...totals),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/class/:className
exports.getClassResults = async (req, res) => {
  try {
    const { term, session } = req.query;
    if (!term || !session)
      return res.status(400).json({ error: "term and session query required" });
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

// GET /api/app/results/student/:id
exports.getStudentResult = async (req, res) => {
  try {
    const { term, session } = req.query;
    if (!term || !session)
      return res.status(400).json({ error: "term and session query required" });
    const result = await Result.findOne({
      studentId: req.params.id,
      term,
      session,
    });
    if (!result) return res.status(404).json({ error: "No result found" });
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/results/student/:id/all
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

// TEMP: wipe ALL results. Remove after use.
exports.wipeAllResults = async (req, res) => {
  try {
    if (req.user.role !== "headmaster") {
      return res.status(403).json({ error: "Headmaster only" });
    }
    const result = await Result.deleteMany({});
    res.json({ message: "All results wiped", deleted: result.deletedCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
