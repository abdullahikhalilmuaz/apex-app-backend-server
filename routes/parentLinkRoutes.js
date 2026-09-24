const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/parentLinkController");

router.post("/link", auth, ctrl.linkChild);
router.get("/children", auth, ctrl.getMyChildren);
router.delete("/link/:studentId", auth, ctrl.unlinkChild);

module.exports = router;
