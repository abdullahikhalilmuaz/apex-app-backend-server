const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const ctrl = require("../controllers/messagingController");

router.post("/sync-me", auth, ctrl.syncMe);
router.get("/recipients", auth, ctrl.getRecipients);
router.get("/conversations", auth, ctrl.getConversations);
router.get("/conversations/:id", auth, ctrl.getMessages);
router.post("/start-direct", auth, ctrl.startDirect);
router.post("/send", auth, ctrl.sendMessage);
router.post("/teachers-group", auth, ctrl.openTeachersGroup);

module.exports = router;