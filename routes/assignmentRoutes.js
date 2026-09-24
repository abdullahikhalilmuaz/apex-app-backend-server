const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/assignmentController");

router.post("/", auth, ctrl.createAssignment);
router.get("/teacher", auth, ctrl.getTeacherAssignments);
router.get("/class/:className", auth, ctrl.getClassAssignments);
router.delete("/:id", auth, ctrl.deleteAssignment);

module.exports = router;
