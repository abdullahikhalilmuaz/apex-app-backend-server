const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/resultController");

router.post("/", auth, ctrl.publishResults);
router.get("/student/:id", auth, ctrl.getStudentResult);
router.get("/student/:id/all", auth, ctrl.getStudentHistory);
router.get("/class/:className", auth, ctrl.getClassResults);

module.exports = router;
