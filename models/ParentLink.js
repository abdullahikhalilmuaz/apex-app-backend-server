const mongoose = require("mongoose");

const ParentLinkSchema = new mongoose.Schema(
  {
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "User",
    },
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Student",
    },
    linkedAt: { type: Date, default: Date.now },
  },
  { collection: "parent_links" },
);

ParentLinkSchema.index({ parentId: 1, studentId: 1 }, { unique: true });

module.exports = mongoose.model("ParentLink", ParentLinkSchema);
