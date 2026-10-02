const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    age: { type: Number, min: 13, max: 100 },
    email: { type: String, required: true, trim: true, lowercase: true },
    password: { type: String, required: true },
    image: { type: String, default: "https://i.pravatar.cc/150?img=12" },
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "post" }],
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", userSchema);
