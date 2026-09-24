const Student = require("../models/Student");

// POST /api/app/students — teacher adds a student
exports.createStudent = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "headmaster") {
      return res
        .status(403)
        .json({ error: "Only teachers and headmasters can add students" });
    }
    const {
      firstName,
      middleName,
      lastName,
      class: className,
      gender,
      dateOfBirth,
      guardianName,
      guardianPhone,
    } = req.body;
    if (!firstName || !lastName || !className) {
      return res
        .status(400)
        .json({ error: "firstName, lastName, class required" });
    }
    const student = new Student({
      firstName,
      middleName: middleName || "",
      lastName,
      class: className,
      gender,
      dateOfBirth,
      guardianName,
      guardianPhone,
      createdBy: req.user.id,
    });
    await student.save();
    res.status(201).json({ message: "Student created", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/class/:className — list students in a class (teacher)
exports.getStudentsByClass = async (req, res) => {
  try {
    const students = await Student.find({
      class: req.params.className,
      isActive: true,
    }).sort({ firstName: 1 });
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/search?q=query — parent searches by name
exports.searchStudents = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) {
      return res.json([]);
    }
    const regex = new RegExp(q, "i");
    const students = await Student.find({
      isActive: true,
      $or: [{ firstName: regex }, { middleName: regex }, { lastName: regex }],
    })
      .limit(20)
      .select("firstName middleName lastName class gender");

    // Sort so that matches starting with the query come first
    const sorted = students.sort((a, b) => {
      const aStarts = a.firstName.toLowerCase().startsWith(q.toLowerCase())
        ? 0
        : 1;
      const bStarts = b.firstName.toLowerCase().startsWith(q.toLowerCase())
        ? 0
        : 1;
      return aStarts - bStarts;
    });

    res.json(sorted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(student);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/app/students/:id — teacher updates
exports.updateStudent = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "headmaster") {
      return res
        .status(403)
        .json({ error: "Only teachers and headmasters can update" });
    }
    const student = await Student.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json({ message: "Student updated", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/app/students/:id — soft delete
exports.deleteStudent = async (req, res) => {
  try {
    if (req.user.role !== "teacher" && req.user.role !== "headmaster") {
      return res.status(403).json({ error: "Only teachers and headmasters" });
    }
    await Student.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: "Student deactivated" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
