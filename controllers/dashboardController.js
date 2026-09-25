const Student = require("../models/Student");
const Attendance = require("../models/Attendance");

// GET /api/app/dashboard/stats — headmaster dashboard stats from app-server
exports.getStats = async (req, res) => {
  try {
    if (req.user.role !== "headmaster") {
      return res.status(403).json({ error: "Headmaster only" });
    }

    const totalPupils = await Student.countDocuments({ isActive: true });

    // Present today = attendance records for today with status "present"
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const presentToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
      status: "present",
    });

    // Total attendance records marked today (for percentage if needed later)
    const markedToday = await Attendance.countDocuments({
      date: { $gte: today, $lt: tomorrow },
    });

    res.json({
      totalPupils,
      presentToday,
      markedToday,
    });
  } catch (err) {
    console.error("dashboard getStats error:", err);
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/dashboard/teacher-stats?class=Primary 5
exports.getTeacherStats = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Teacher only" });
    }

    const className = req.query.class;
    if (!className) {
      return res.json({ pupils: 0, present: 0, absent: 0 });
    }

    const pupils = await Student.countDocuments({
      class: className,
      isActive: true,
    });

    // Today's attendance for this class
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const records = await Attendance.find({
      class: className,
      date: { $gte: today, $lt: tomorrow },
    });

    const present = records.filter((r) => r.status === "present").length;
    const absent = records.filter((r) => r.status === "absent").length;

    res.json({ pupils, present, absent });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};