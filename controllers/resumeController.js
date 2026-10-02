const fs = require("fs/promises");
const path = require("path");
const multer = require("multer");
const pdfParse = require("pdf-parse");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const userModel = require("../models/user");
const Resume = require("../models/resumeModel");

const uploadDir = path.join(process.cwd(), "uploads");
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safeName = path.basename(file.originalname).replace(/[^a-zA-Z0-9._-]/g, "_");
    cb(null, `${Date.now()}-${safeName}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || path.extname(file.originalname).toLowerCase() === ".pdf") {
      return cb(null, true);
    }
    return cb(new Error("Only PDF files are allowed."));
  },
});

function parseJsonResponse(raw) {
  const cleaned = String(raw || "")
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();

  try {
    return JSON.parse(cleaned);
  } catch (_error) {
    const start = cleaned.indexOf("{");
    const end = cleaned.lastIndexOf("}");
    if (start !== -1 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error("AI returned invalid JSON.");
  }
}

function normalizeAnalysis(data) {
  const score = Math.max(0, Math.min(100, Number(data?.atsScore) || 0));
  const toArray = (value) => Array.isArray(value) ? value.map((item) => String(item).trim()).filter(Boolean).slice(0, 30) : [];
  return {
    atsScore: score,
    skills: toArray(data?.skills),
    missingSkills: toArray(data?.missingSkills),
    suggestions: toArray(data?.suggestions),
  };
}

exports.upload = upload;

exports.analyze = async (req, res) => {
  let uploadedPath;
  try {
    if (!req.file) return res.status(400).redirect("/resume?error=missing");
    uploadedPath = req.file.path;

    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).redirect("/resume?error=ai");
    }

    const user = await userModel.findById(req.user.id);
    if (!user) return res.redirect("/login");

    const fileBuffer = await fs.readFile(req.file.path);
    const pdfData = await pdfParse(fileBuffer);
    const resumeText = String(pdfData.text || "").trim();

    if (!resumeText) return res.status(400).redirect("/resume?error=empty");

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
    const prompt = `Analyze this resume for a student placement context. Return ONLY valid JSON with this exact shape: {"atsScore": number, "skills": string[], "missingSkills": string[], "suggestions": string[]}. Keep suggestions practical and concise. Resume:\n\n${resumeText.slice(0, 30000)}`;

    const result = await model.generateContent(prompt);
    const analysis = normalizeAnalysis(parseJsonResponse(result.response.text()));

    await Resume.create({
      userId: user._id,
      filename: req.file.filename,
      atsScore: analysis.atsScore,
      skills: analysis.skills,
      missingSkills: analysis.missingSkills,
      suggestions: analysis.suggestions,
    });

    return res.redirect("/resume?success=1");
  } catch (error) {
    console.error("Resume analysis error:", error);
    return res.status(500).redirect("/resume?error=analysis");
  } finally {
    if (uploadedPath) await fs.unlink(uploadedPath).catch(() => {});
  }
};

exports.page = async (req, res) => {
  try {
    const resumeData = await Resume.findOne({ userId: req.user.id }).sort({ createdAt: -1 }).lean();
    res.render("resume", { resumeData });
  } catch (error) {
    console.error("Resume page error:", error);
    res.status(500).send("Unable to load resume analyzer.");
  }
};
