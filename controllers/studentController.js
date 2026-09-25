const Student = require("../models/Student");

// Generate a stable admission number from student _id
function ensureAdmissionNumber(student) {
  if (student.admissionNumber) return student.admissionNumber;
  const hex = String(student._id).slice(-6);
  const num = (parseInt(hex, 16) % 9000) + 1000;
  const yy = String(
    new Date(student.createdAt || Date.now()).getFullYear(),
  ).slice(-2);
  return `AGA/KT/${yy}/${num}`;
}

function attachAdmission(s) {
  const obj = s.toObject ? s.toObject() : s;
  obj.admissionNumber = ensureAdmissionNumber(obj);
  return obj;
}

// POST /api/app/students
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
    student.admissionNumber = ensureAdmissionNumber(student);
    await student.save();

    res.status(201).json({ message: "Student created", student });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/all — every student (headmaster & teacher)
exports.getAllStudents = async (req, res) => {
  try {
    if (req.user.role !== "headmaster" && req.user.role !== "teacher") {
      return res.status(403).json({ error: "Not allowed" });
    }
    const students = await Student.find({ isActive: true })
      .sort({ class: 1, firstName: 1 })
      .select(
        "firstName middleName lastName class gender admissionNumber createdAt",
      );
    res.json(students.map(attachAdmission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/class/:className
exports.getStudentsByClass = async (req, res) => {
  try {
    const students = await Student.find({
      class: req.params.className,
      isActive: true,
    }).sort({ firstName: 1 });
    res.json(students.map(attachAdmission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/search?q=query
exports.searchStudents = async (req, res) => {
  try {
    const q = (req.query.q || "").trim();
    if (q.length < 2) return res.json([]);

    const regex = new RegExp(q, "i");
    const students = await Student.find({
      isActive: true,
      $or: [{ firstName: regex }, { middleName: regex }, { lastName: regex }],
    })
      .limit(20)
      .select(
        "firstName middleName lastName class gender admissionNumber createdAt",
      );

    const sorted = students.sort((a, b) => {
      const aStarts = a.firstName.toLowerCase().startsWith(q.toLowerCase())
        ? 0
        : 1;
      const bStarts = b.firstName.toLowerCase().startsWith(q.toLowerCase())
        ? 0
        : 1;
      return aStarts - bStarts;
    });

    res.json(sorted.map(attachAdmission));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// GET /api/app/students/:id
exports.getStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) return res.status(404).json({ error: "Student not found" });
    res.json(attachAdmission(student));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// PUT /api/app/students/:id
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
    res.json({ message: "Student updated", student: attachAdmission(student) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// DELETE /api/app/students/:id
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
