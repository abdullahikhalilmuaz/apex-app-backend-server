const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/dashboardController");

router.get("/stats", auth, ctrl.getStats);
router.get("/teacher-stats", auth, ctrl.getTeacherStats);

module.exports = router;
