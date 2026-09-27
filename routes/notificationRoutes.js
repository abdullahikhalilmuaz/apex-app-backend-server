const express = require("express");
const router = express.Router();
const auth = require("../middleware/auth");
const PushToken = require("../models/PushToken");

router.post("/register", auth, async (req, res) => {
  try {
    const { token, device } = req.body;
    if (!token) return res.status(400).json({ error: "token required" });

    const existing = await PushToken.findOne({ token });
    if (existing) {
      existing.userId = req.user.id;
      existing.role = req.user.role;
      existing.device = device || existing.device;
      existing.updatedAt = new Date();
      await existing.save();
      return res.json({ message: "Token updated", token: existing });
    }

    const created = await PushToken.create({
      userId: req.user.id,
      role: req.user.role,
      token,
      device: device || "unknown",
    });
    res.status(201).json({ message: "Token registered", token: created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/unregister", auth, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ error: "token required" });
    await PushToken.deleteOne({ token });
    res.json({ message: "Token removed" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
