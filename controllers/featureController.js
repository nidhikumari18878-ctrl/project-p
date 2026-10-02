const mongoose = require("mongoose");
const userModel = require("../models/user");
const applicationModel = require("../models/applicationModel");
const opportunityModel = require("../models/opportunityModel");
const savedOpportunityModel = require("../models/savedOpportunityModel");
const goalModel = require("../models/goalModel");
const Resume = require("../models/resumeModel");

function normalizeWords(value) {
  return new Set(
    String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9+#.\- ]/g, " ")
      .split(/[\s,|/]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 1)
  );
}

exports.calendar = async (req, res) => {
  const user = await userModel.findById(req.user.id).lean();
  if (!user) return res.redirect("/login");
  const applications = await applicationModel.find({ user: user._id, $or: [{ interviewDate: { $exists: true, $ne: null } }, { deadline: { $exists: true, $ne: null } }] }).sort({ interviewDate: 1, deadline: 1 }).lean();
  res.render("calendar", { applications });
};

exports.goals = async (req, res) => {
  const user = await userModel.findById(req.user.id).lean();
  if (!user) return res.redirect("/login");
  const [goals, applications, interviews] = await Promise.all([
    goalModel.find({ user: user._id, active: true }).sort({ deadline: 1, createdAt: -1 }).lean(),
    applicationModel.countDocuments({ user: user._id }),
    applicationModel.countDocuments({ user: user._id, status: "Interview" }),
  ]);
  const progress = goals.map((goal) => ({
    ...goal,
    current: goal.type === "interviews" ? interviews : goal.type === "applications" ? applications : 0,
    percent: Math.min(100, Math.round(((goal.type === "interviews" ? interviews : goal.type === "applications" ? applications : 0) / goal.target) * 100)),
  }));
  res.render("goals", { goals: progress });
};

exports.createGoal = async (req, res) => {
  const title = String(req.body.title || "").trim();
  const target = Number(req.body.target);
  const type = ["applications", "interviews", "custom"].includes(req.body.type) ? req.body.type : "applications";
  if (!title || !Number.isInteger(target) || target < 1 || target > 100000) return res.redirect("/goals?error=invalid");
  await goalModel.create({ user: req.user.id, title, target, type, deadline: req.body.deadline || undefined });
  res.redirect("/goals?success=created");
};

exports.deleteGoal = async (req, res) => {
  if (mongoose.isValidObjectId(req.params.id)) await goalModel.findOneAndDelete({ _id: req.params.id, user: req.user.id });
  res.redirect("/goals?success=deleted");
};

exports.saved = async (req, res) => {
  const user = await userModel.findById(req.user.id).lean();
  if (!user) return res.redirect("/login");
  const saved = await savedOpportunityModel.find({ user: user._id }).populate("opportunity").sort({ createdAt: -1 }).lean();
  res.render("saved", { saved: saved.filter((x) => x.opportunity) });
};

exports.toggleSaved = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.redirect("/opportunities");
  const existing = await savedOpportunityModel.findOne({ user: req.user.id, opportunity: req.params.id });
  if (existing) await existing.deleteOne();
  else if (await opportunityModel.exists({ _id: req.params.id })) await savedOpportunityModel.create({ user: req.user.id, opportunity: req.params.id });
  res.redirect(req.get("referer") || "/opportunities");
};

exports.match = async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) return res.status(400).json({ error: "Invalid opportunity." });
  const [user, opportunity, resume] = await Promise.all([
    userModel.findById(req.user.id).lean(),
    opportunityModel.findById(req.params.id).lean(),
    Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean(),
  ]);
  if (!user || !opportunity) return res.status(404).json({ error: "Opportunity not found." });

  const profileWords = normalizeWords(`${user.name} ${resume?.skills || ""} ${resume?.analysis || ""}`);
  const skills = Array.isArray(opportunity.skills) ? opportunity.skills : String(opportunity.skills || "").split(",");
  const skillWords = skills.flatMap((s) => [...normalizeWords(s)]);
  const uniqueSkills = [...new Set(skillWords)];
  const matched = uniqueSkills.filter((skill) => profileWords.has(skill));
  const score = uniqueSkills.length ? Math.round((matched.length / uniqueSkills.length) * 100) : (resume ? Math.min(90, Number(resume.atsScore) || 0) : 50);
  const missing = uniqueSkills.filter((skill) => !profileWords.has(skill)).slice(0, 6);
  res.json({ score, matched: matched.slice(0, 8), missing });
};

exports.analytics = async (req, res) => {
  const user = await userModel.findById(req.user.id).lean();
  if (!user) return res.redirect("/login");
  const [apps, total, selected, rejected] = await Promise.all([
    applicationModel.find({ user: user._id }).sort({ createdAt: 1 }).lean(),
    applicationModel.countDocuments({ user: user._id }),
    applicationModel.countDocuments({ user: user._id, status: "Selected" }),
    applicationModel.countDocuments({ user: user._id, status: "Rejected" }),
  ]);
  const statusCounts = apps.reduce((acc, app) => { acc[app.status] = (acc[app.status] || 0) + 1; return acc; }, {});
  const monthly = {};
  apps.forEach((app) => { const key = new Date(app.createdAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" }); monthly[key] = (monthly[key] || 0) + 1; });
  res.render("analytics", { total, selected, rejected, statusCounts, monthly });
};
