const userModel = require("../models/user");
const applicationModel = require("../models/applicationModel");

exports.getProfile = async (req, res) => {
  try {
    const user = await userModel.findOne({
      email: req.user.email,
    });

    const totalApplied = await applicationModel.countDocuments({
      user: user._id,
    });

    const totalInterview = await applicationModel.countDocuments({
      user: user._id,
      status: "Interview",
    });

    const totalSelected = await applicationModel.countDocuments({
      user: user._id,
      status: "Selected",
    });

    res.render("profile", {
      user,
      totalApplied,
      totalInterview,
      totalSelected,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};
