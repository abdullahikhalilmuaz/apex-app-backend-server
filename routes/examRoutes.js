const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/examController");

router.post("/", auth, ctrl.saveExam);
router.get("/teacher", auth, ctrl.getTeacherExams);
router.get("/class/:className", auth, ctrl.getClassExams);
router.get("/:id", auth, ctrl.getExam);
router.delete("/:id", auth, ctrl.deleteExam);
router.post("/:id/submit", auth, ctrl.submitExam);

module.exports = router;
