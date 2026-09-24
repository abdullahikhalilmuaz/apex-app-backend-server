const Attendance = require("../models/Attendance");
const Student = require("../models/Student");

// POST /api/app/attendance — bulk mark
// body: { class, date, records: [{ studentId, status }] }
exports.markAttendance = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can mark attendance" });
    }
    const { class: className, date, records } = req.body;
    if (!className || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: "class, date, records required" });
    }

    const d = new Date(date);
    d.setHours(0, 0, 0, 0);

    const results = [];
    for (const rec of records) {
      const attendance = await Attendance.findOneAndUpdate(
        { studentId: rec.studentId, date: d },
        {
          studentId: rec.studentId,
          class: className,
          date: d,
          status: rec.status,
          markedBy: req.user.id,
          notes: rec.notes || "",
        },
        { upsert: true, new: true },
      );
      results.push(attendance);
    }

    res.json({ message: "Attendance saved", count: results.length });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/attendance/class/:className?date=YYYY-MM-DD
exports.getClassAttendance = async (req, res) => {
  try {
    const { className } = req.params;
    const dateStr = req.query.date;
    if (!dateStr) return res.status(400).json({ error: "date query required" });

    const d = new Date(dateStr);
    d.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      class: className,
      date: d,
    }).populate("studentId", "firstName middleName lastName");
    res.json(records);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/attendance/student/:id?from=YYYY-MM-DD&to=YYYY-MM-DD
exports.getStudentAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const from = req.query.from ? new Date(req.query.from) : new Date(0);
    const to = req.query.to ? new Date(req.query.to) : new Date();

    const records = await Attendance.find({
      studentId: id,
      date: { $gte: from, $lte: to },
    }).sort({ date: -1 });

    // Summary
    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;
    const late = records.filter((r) => r.status === "late").length;

    res.json({
      records,
      summary: { present, absent, late, total: records.length },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
