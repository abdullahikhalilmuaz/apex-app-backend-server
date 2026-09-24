const mongoose = require("mongoose");

const StudentSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true, trim: true },
    middleName: { type: String, trim: true, default: "" },
    lastName: { type: String, required: true, trim: true },
    class: { type: String, required: true },
    gender: { type: String, enum: ["male", "female"], default: "male" },
    dateOfBirth: Date,
    guardianName: String,
    guardianPhone: String,
    isActive: { type: Boolean, default: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    createdAt: { type: Date, default: Date.now },
  },
  { collection: "students" },
);

// Text index for parent search
StudentSchema.index({
  firstName: "text",
  middleName: "text",
  lastName: "text",
});

module.exports = mongoose.model("Student", StudentSchema);
