const userModel = require("../models/user");
const applicationModel = require("../models/applicationModel");
const Resume = require("../models/resumeModel");

exports.getDashboard = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).lean();
    if (!user) return res.redirect("/login");

    const [applications, totalApplications, totalInterviews, totalSelected, totalOA, resumeData] = await Promise.all([
      applicationModel.find({ user: user._id }).sort({ updatedAt: -1 }).limit(6).lean(),
      applicationModel.countDocuments({ user: user._id }),
      applicationModel.countDocuments({ user: user._id, status: "Interview" }),
      applicationModel.countDocuments({ user: user._id, status: "Selected" }),
      applicationModel.countDocuments({ user: user._id, status: "OA Round" }),
      Resume.findOne({ userId: user._id }).sort({ createdAt: -1 }).lean(),
    ]);

    res.render("dashboard", {
      user,
      applications,
      totalApplications,
      totalInterviews,
      totalSelected,
      totalOA,
      resumeData,
    });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(500).send("Unable to load dashboard.");
  }
};
