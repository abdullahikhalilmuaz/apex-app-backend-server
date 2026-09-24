const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/attendanceController");

router.post("/", auth, ctrl.markAttendance);
router.get("/class/:className", auth, ctrl.getClassAttendance);
router.get("/student/:id", auth, ctrl.getStudentAttendance);

module.exports = router;
