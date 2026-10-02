const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema(
  {
    companyName: { type: String, required: true, trim: true },
    role: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["Applied", "OA Round", "Interview", "Selected", "Rejected"],
      default: "Applied",
    },
    location: { type: String, trim: true, default: "-" },
    package: { type: String, trim: true, default: "-" },
    note: { type: String, trim: true, default: "" },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("application", applicationSchema);
