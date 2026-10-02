const userModel = require("../models/user");
const applicationModel = require("../models/applicationModel");

exports.getProfile = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.redirect("/login");

    const [totalApplied, totalInterview, totalSelected] = await Promise.all([
      applicationModel.countDocuments({ user: user._id }),
      applicationModel.countDocuments({ user: user._id, status: "Interview" }),
      applicationModel.countDocuments({ user: user._id, status: "Selected" }),
    ]);

    res.render("profile", { user, totalApplied, totalInterview, totalSelected });
  } catch (error) {
    console.error("Profile error:", error);
    res.status(500).send("Server Error");
  }
};
