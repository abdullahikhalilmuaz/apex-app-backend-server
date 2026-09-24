const Assignment = require("../models/Assignment");

// POST /api/app/assignments
exports.createAssignment = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res
        .status(403)
        .json({ error: "Only teachers can create assignments" });
    }
    const {
      title,
      description,
      class: className,
      subject,
      topic,
      dueDate,
    } = req.body;
    if (!title || !className) {
      return res.status(400).json({ error: "title and class required" });
    }
    const assignment = new Assignment({
      title,
      description: description || "",
      class: className,
      subject: subject || "", // "" means no subject
      topic: topic || "",
      dueDate,
      teacherId: req.user.id,
      teacherName: req.user.name || "Teacher",
    });
    await assignment.save();
    res.status(201).json({ message: "Assignment created", assignment });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/assignments/class/:className?subject=Math
exports.getClassAssignments = async (req, res) => {
  try {
    const query = { class: req.params.className };
    if (req.query.subject) query.subject = req.query.subject;
    const assignments = await Assignment.find(query).sort({ createdAt: -1 });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/assignments/teacher — teacher's own posted assignments
exports.getTeacherAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({ teacherId: req.user.id }).sort({
      createdAt: -1,
    });
    res.json(assignments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/app/assignments/:id
exports.deleteAssignment = async (req, res) => {
  try {
    if (req.user.role !== "teacher") {
      return res.status(403).json({ error: "Only teachers can delete" });
    }
    const a = await Assignment.findById(req.params.id);
    if (!a) return res.status(404).json({ error: "Assignment not found" });
    if (String(a.teacherId) !== String(req.user.id)) {
      return res.status(403).json({ error: "You can only delete your own" });
    }
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: "Assignment deleted" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
