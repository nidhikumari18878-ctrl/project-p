const mongoose = require("mongoose");
const userModel = require("../models/user");
const applicationModel = require("../models/applicationModel");

const STATUSES = ["Applied", "OA Round", "Interview", "Selected", "Rejected"];

exports.list = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.redirect("/login");

    const applications = await applicationModel
      .find({ user: user._id })
      .sort({ updatedAt: -1 })
      .lean();

    res.render("application", { applications, statuses: STATUSES });
  } catch (error) {
    console.error("Applications list error:", error);
    res.status(500).send("Unable to load applications.");
  }
};

exports.create = async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id);
    if (!user) return res.redirect("/login");

    const companyName = String(req.body.companyName || "").trim();
    const role = String(req.body.role || "").trim();
    const status = String(req.body.status || "Applied").trim();

    if (!companyName || !role || !STATUSES.includes(status)) {
      return res.status(400).redirect("/application?error=invalid");
    }

    await applicationModel.create({
      companyName,
      role,
      status,
      location: String(req.body.location || "-").trim(),
      package: String(req.body.package || "-").trim(),
      note: String(req.body.note || "").trim(),
      interviewDate: req.body.interviewDate || undefined,
      deadline: req.body.deadline || undefined,
      user: user._id,
    });

    res.redirect("/application?success=created");
  } catch (error) {
    console.error("Application create error:", error);
    res.status(500).redirect("/application?error=server");
  }
};

exports.updateStatus = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect("/application?error=invalid");
    const status = String(req.body.status || "").trim();
    if (!STATUSES.includes(status)) return res.redirect("/application?error=invalid");

    await applicationModel.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      { status },
      { runValidators: true }
    );

    res.redirect("/application?success=updated");
  } catch (error) {
    console.error("Application status error:", error);
    res.status(500).redirect("/application?error=server");
  }
};

exports.remove = async (req, res) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.redirect("/application?error=invalid");

    await applicationModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    res.redirect("/application?success=deleted");
  } catch (error) {
    console.error("Application delete error:", error);
    res.status(500).redirect("/application?error=server");
  }
};
