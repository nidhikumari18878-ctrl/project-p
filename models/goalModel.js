const mongoose = require("mongoose");

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    target: { type: Number, required: true, min: 1, max: 100000 },
    deadline: { type: Date },
    type: { type: String, enum: ["applications", "interviews", "custom"], default: "applications" },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Goal || mongoose.model("Goal", goalSchema);
