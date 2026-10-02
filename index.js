require("dotenv").config();

const express = require("express");
const axios=require("axios");
const app = express();
const cookieParser = require('cookie-parser');
const path = require("path");

const flash = require("connect-flash");
const mongoose = require("mongoose");
const profileRoutes = require("./routes/profileRoutes");
const authRoutes  = require("./routes/authRoutes");
const opportunityModel = require("./models/opportunityModel");
const applicationModel = require("./models/applicationModel");
const userModel = require("./models/user");
const multer = require("multer");
const Resume = require("./models/resumeModel");
const pdfParse = require("pdf-parse");
const fs=require("fs");
const {GoogleGenerativeAI}=require("@google/generative-ai");
const genAI=new GoogleGenerativeAI(process.env.GEMINI_API_KEY)



app.set("view engine", 'ejs');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));
app.use(cookieParser());
app.use(flash());
const expressSession = require("express-session");
app.use(expressSession({
    resave: false,
    saveUninitialized: false,
    secret: process.env.EXPRESS_SESSION_SECRET
}));



mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("✅ MongoDB connected");

    // app.listen(PORT, () => {
    //   console.log(`Server running on ${PORT}`);
    // });
  })
  .catch(err => {
    console.error("❌ MongoDB Error:", err);
  });

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "uploads/");
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"), false);
    }
  }
});
const isLoggedIn=require("./middlewares/isLoggedIn");

app.use("/", authRoutes);
app.use("/", profileRoutes);
// Routes
app.get("/", (req, res) => {
    res.render("index");
});

app.get("/test-ai", async (req, res) => {
  try {

    const model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash"
    });

    const result = await model.generateContent(
      "What is Placement Tracker?"
    );

    res.send(result.response.text());

  } catch(err) {

    console.log(err);
    res.send(err.message);

  }
});

app.get("/application", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let applications = await applicationModel.find({ user: user._id });
    res.render("application", { applications });
});

// app.get("/resume", isLoggedIn,async (req, res) => {
//     const resumeData = await Resume.findOne().sort({ createdAt: -1 });
//     res.render("resume", { resumeData });
// });

app.post(
  "/upload-resume",isLoggedIn,
  upload.single("resume"),
  async (req, res) => {
    if(!req.file){

return res.send("Please upload PDF");

}

    try {

      const fileBuffer =
        fs.readFileSync(req.file.path);

      const pdfData =
        await pdfParse(fileBuffer);

      const resumeText =
        pdfData.text;

      const model =
        genAI.getGenerativeModel({
          model: "gemini-2.0-flash"
        });

      const prompt = `
Analyze this resume.

Return ONLY valid JSON.

Format:

{
  "atsScore": number,
  "skills": [],
  "missingSkills": [],
  "suggestions": []
}

Resume:

${resumeText}
`;

      const result =
        await model.generateContent(prompt);

      const response =
        result.response.text();

      const cleanJson =
        response
          .replace(/```json/g, "")
          .replace(/```/g, "")
          .trim();

      let analysis;

try{
  analysis = JSON.parse(cleanJson);
}
catch(err){
  console.log("Invalid JSON from Gemini");
  return res.send("AI returned invalid response");
}

     let user = await userModel.findOne({
    email:req.user.email
});

await Resume.create({

userId:user._id,

filename:req.file.filename,

atsScore:analysis.atsScore,

skills:analysis.skills,

missingSkills:analysis.missingSkills,

suggestions:analysis.suggestions

});

      res.redirect("/resume");

    } catch (err) {

      console.log(err);

      res.send(
        "Resume analysis failed"
      );

    }

  }
);
app.get("/resume",isLoggedIn,async(req,res)=>{

const user=await userModel.findOne({
email:req.user.email
});

const resumeData=await Resume.findOne({
userId:user._id
}).sort({createdAt:-1});

res.render("resume",{resumeData});

});
app.get("/dashboard", isLoggedIn, async (req, res) => {

    const user = await userModel.findOne({
        email: req.user.email
    });

    const resumeData = await Resume.findOne({
        userId: user._id
    }).sort({ createdAt: -1 });

    res.render("dashboard", {
        user,
        resumeData
    });

});
app.get("/update-profile", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    res.render("update-profile", { user });
});

app.post("/update-profile", isLoggedIn, async (req, res) => {
    let { name, email, image } = req.body;
    await userModel.findOneAndUpdate({ email: req.user.email }, { name, email, image });
    res.redirect("/profile");
});

app.get("/opportunities", isLoggedIn, async (req, res) => {
    try {
      console.log("route hit")
        const search = req.query.search || "";
        console.log("search=",search);
        const opportunities = await opportunityModel.find({
            companyName: {
                $regex: search,
                $options: "i"
            }
        });
        console.log(opportunities);
        
        res.render("opportunities", { opportunities, search });
        
    } catch (err) {
        res.send(err.message);
    }
});


app.get("/fetch-jobs", async (req, res) => {
  try {
    const response = await axios.get(
      "https://jsearch.p.rapidapi.com/search",
      {
        params: {
          query: "Software Engineer Internship India",
          page: "1",
          num_pages: "1"
        },
        headers: {
          "X-RapidAPI-Key": process.env.RAPIDAPI_KEY,
          "X-RapidAPI-Host": "jsearch27.p.rapidapi.com"
        }
      }
    );

    console.log(response.data);
    const jobs = response.data.data;

for (const job of jobs) {

  await opportunityModel.updateOne(
    {
      companyName: job.employer_name,
      role: job.job_title,
      applyLink: job.job_apply_link
    },
    {
      companyName: job.employer_name,
      role: job.job_title,
      type: job.job_employment_type,
      location: job.job_city || job.job_country || "Remote",
      stipend: "Not Mentioned",
      deadline: "Apply ASAP",
      applyLink: job.job_apply_link,
      logo: job.employer_logo || "",
      skills: job.job_required_skills || []
    },
    { upsert: true }
  );

}

res.send("Jobs Imported Successfully");

    

  } catch (err) {
    console.log(err.response?.data || err.message);
    res.send("Error");
  }
});

app.get("/track/:id", isLoggedIn, async (req, res) => {
    let user = await userModel.findOne({ email: req.user.email });
    let opportunity = await opportunityModel.findOne({ _id: req.params.id });

    await applicationModel.create({
        companyName: opportunity.companyName,
        role: opportunity.role,
        status: "Applied",
        location: opportunity.location,
        package: opportunity.stipend,
        user: user._id
    });

    res.redirect("/application");
});

app.get("/logout", (req, res) => {
    res.cookie("token", "");
    res.redirect('/login');
});

app.listen(5000, () => {
    console.log("Server is running on port 5000");
});

// const PORT = process.env.PORT || 5000;

// app.listen(PORT, () => {
//   console.log(`Server running on ${PORT}`);
// });