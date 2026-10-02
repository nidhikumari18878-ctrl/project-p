const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const resumeController = require("../controllers/resumeController");

router.get("/resume", isLoggedIn, resumeController.page);
router.post("/upload-resume", isLoggedIn, resumeController.upload.single("resume"), resumeController.analyze);

module.exports = router;
