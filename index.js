require("dotenv").config();

const path = require("path");
const fs = require("fs");
const express = require("express");
const cookieParser = require("cookie-parser");
const flash = require("connect-flash");
const expressSession = require("express-session");
const mongoose = require("mongoose");
const axios = require("axios");

const authRoutes = require("./routes/authRoutes");
const profileRoutes = require("./routes/profileRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const applicationRoutes = require("./routes/applicationRoutes");
const resumeRoutes = require("./routes/resumeRoutes");
const isLoggedIn = require("./middlewares/isLoggedIn");
const userModel = require("./models/user");
const opportunityModel = require("./models/opportunityModel");
const applicationModel = require("./models/applicationModel");

const app = express();
const PORT = Number(process.env.PORT) || 5000;
const uploadsDir = path.join(process.cwd(), "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.disable("x-powered-by");

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true, limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use(cookieParser());
app.use(flash());
app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET || "development-session-secret",
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  })
);

app.use((req, res, next) => {
  res.locals.currentPath = req.path;
  res.locals.query = req.query || {};
  next();
});

app.use("/", authRoutes);
app.use("/", profileRoutes);
app.use("/", dashboardRoutes);
app.use("/", applicationRoutes);
app.use("/", resumeRoutes);

app.get("/", (req, res) => res.render("index"));

app.get("/health", (_req, res) => {
  res.status(200).json({ ok: true, service: "placement-tracker" });
});

app.get("/test-ai", isLoggedIn, async (_req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) return res.status(503).send("GEMINI_API_KEY is not configured.");
    const { GoogleGenerativeAI } = require("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: process.env.GEMINI_MODEL || "gemini-2.0-flash" });
    const result = await model.generateContent("Reply with exactly: Placement Tracker AI is working.");
    res.send(result.response.text());
  } catch (error) {
    console.error("AI health check error:", error);
    res.status(502).send("AI service check failed.");
  }
});

app.get("/opportunities", isLoggedIn, async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();
    const safeSearch = search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const query = safeSearch
      ? {
          $or: [
            { companyName: { $regex: safeSearch, $options: "i" } },
            { role: { $regex: safeSearch, $options: "i" } },
            { location: { $regex: safeSearch, $options: "i" } },
            { type: { $regex: safeSearch, $options: "i" } },
            { skills: { $regex: safeSearch, $options: "i" } },
          ],
        }
      : {};

    const opportunities = await opportunityModel.find(query).sort({ createdAt: -1 }).lean();
    res.render("opportunities", { opportunities, search });
  } catch (error) {
    console.error("Opportunities error:", error);
    res.status(500).send("Unable to load opportunities.");
  }
});

app.get("/fetch-jobs", isLoggedIn, async (_req, res) => {
  try {
    if (!process.env.RAPIDAPI_KEY) {
      return res.status(503).send("RAPIDAPI_KEY is not configured.");
    }

    const response = await axios.get("https://jsearch.p.rapidapi.com/search", {
      params: {
        query: "Software Engineer Internship India",
        page: "1",
        num_pages: "1",
      },
      headers: {
        "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
        "X-RapidAPI-Host": "jsearch27.p.rapidapi.com",
      },
      timeout: 15000,
    });

    const jobs = Array.isArray(response.data?.data) ? response.data.data : [];
    let imported = 0;

    for (const job of jobs) {
      if (!job.employer_name || !job.job_title || !job.job_apply_link) continue;

      await opportunityModel.updateOne(
        {
          companyName: job.employer_name,
          role: job.job_title,
          applyLink: job.job_apply_link,
        },
        {
          $set: {
            companyName: job.employer_name,
            role: job.job_title,
            type: job.job_employment_type || "Not specified",
            location: job.job_city || job.job_country || "Remote",
            stipend: "Not Mentioned",
            deadline: job.job_offer_expiration_datetime_utc || "Apply ASAP",
            applyLink: job.job_apply_link,
            logo: job.employer_logo || "",
            skills: Array.isArray(job.job_required_skills) ? job.job_required_skills : [],
          },
        },
        { upsert: true }
      );
      imported += 1;
    }

    return res.redirect(`/opportunities?imported=${imported}`);
  } catch (error) {
    console.error("Job import error:", error.response?.data || error.message);
    return res.status(502).send("Unable to import jobs right now.");
  }
});

app.post("/track/:id", isLoggedIn, async (req, res) => {
  try {
    const [user, opportunity] = await Promise.all([
      userModel.findById(req.user.id),
      opportunityModel.findById(req.params.id),
    ]);

    if (!user) return res.redirect("/login");
    if (!opportunity) return res.status(404).send("Opportunity not found.");

    const existing = await applicationModel.findOne({
      user: user._id,
      companyName: opportunity.companyName,
      role: opportunity.role,
    });

    if (!existing) {
      await applicationModel.create({
        companyName: opportunity.companyName,
        role: opportunity.role,
        status: "Applied",
        location: opportunity.location || "-",
        package: opportunity.stipend || "-",
        user: user._id,
      });
    }

    return res.redirect("/application?success=tracked");
  } catch (error) {
    console.error("Track opportunity error:", error);
    return res.status(500).send("Unable to track opportunity.");
  }
});

app.get("/logout", (_req, res) => {
  res.clearCookie("token");
  res.redirect("/login");
});

app.use((_req, res) => {
  res.status(404).render("404");
});

app.use((err, req, res, _next) => {
  console.error("Unhandled error:", err);
  if (req.path === "/upload-resume") {
    return res.status(400).redirect("/resume?error=upload");
  }
  return res.status(500).send("Something went wrong. Please try again.");
});
const dns=require("dns");
dns.setServers(["8.8.8.8","1.1.1.1"]);

async function startServer() {
  if (!process.env.MONGODB_URI) {
    throw new Error("MONGODB_URI is not configured. Add it to your .env file.");
  }

  await mongoose.connect(process.env.MONGODB_URI);
  console.log("✅ MongoDB connected");

  app.listen(PORT, () => {
    console.log(`🚀 Placement Tracker running on port ${PORT}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  });
}

module.exports = app;
