const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/studentController");

router.get("/search", auth, ctrl.searchStudents);
router.get("/class/:className", auth, ctrl.getStudentsByClass);
router.get("/:id", auth, ctrl.getStudent);
router.post("/", auth, ctrl.createStudent);
router.put("/:id", auth, ctrl.updateStudent);
router.delete("/:id", auth, ctrl.deleteStudent);

module.exports = router;
