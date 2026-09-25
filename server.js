const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// CORS — allow mobile app + web
app.use(
  cors({
    origin: "*", // mobile app has no origin header → allow all
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: false,
  }),
);

app.use(express.json({ limit: "10mb" }));

mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => console.log("✅ App-Server MongoDB connected"))
  .catch((err) => console.log("❌ MongoDB error:", err));

// Routes
const studentRoutes = require("./routes/studentRoutes");
const attendanceRoutes = require("./routes/attendanceRoutes");
const resultRoutes = require("./routes/resultRoutes");
const assignmentRoutes = require("./routes/assignmentRoutes");
const parentLinkRoutes = require("./routes/parentLinkRoutes");
const examRoutes = require("./routes/examRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

app.use("/api/app/students", studentRoutes);
app.use("/api/app/attendance", attendanceRoutes);
app.use("/api/app/results", resultRoutes);
app.use("/api/app/assignments", assignmentRoutes);
app.use("/api/app/parent", parentLinkRoutes);
app.use("/api/app/exams", examRoutes);
app.use("/api/app/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "App-Server running" });
});

app.listen(PORT, () => {
  console.log(`🚀 App-Server running on port ${PORT}`);
});
