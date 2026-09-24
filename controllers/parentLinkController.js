const ParentLink = require("../models/ParentLink");
const Student = require("../models/Student");

// POST /api/app/parent/link — link a parent to a student
exports.linkChild = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Only parents can link children" });
    }
    const { studentId } = req.body;
    if (!studentId)
      return res.status(400).json({ error: "studentId required" });

    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });

    const existing = await ParentLink.findOne({
      parentId: req.user.id,
      studentId,
    });
    if (existing) {
      return res.status(400).json({ error: "Already linked to this child" });
    }

    const link = await ParentLink.create({
      parentId: req.user.id,
      studentId,
    });
    res.status(201).json({ message: "Child linked", link, student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/parent/children — list linked children
exports.getMyChildren = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Parents only" });
    }
    const links = await ParentLink.find({ parentId: req.user.id }).populate(
      "studentId",
    );
    res.json(links.map((l) => l.studentId).filter(Boolean));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/app/parent/link/:studentId — unlink
exports.unlinkChild = async (req, res) => {
  try {
    if (req.user.role !== "parent") {
      return res.status(403).json({ error: "Parents only" });
    }
    await ParentLink.deleteOne({
      parentId: req.user.id,
      studentId: req.params.studentId,
    });
    res.json({ message: "Child unlinked" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
