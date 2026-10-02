const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const profileController = require("../controllers/profileController");
const userModel = require("../models/user");
const jwt = require("jsonwebtoken");

router.get("/profile", isLoggedIn, profileController.getProfile);

router.get("/update-profile", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findById(req.user.id).lean();
    if (!user) return res.redirect("/login");
    res.render("update-profile", { user });
  } catch (error) {
    console.error("Edit profile page error:", error);
    res.status(500).send("Unable to load profile editor.");
  }
});

router.post("/update-profile", isLoggedIn, async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const image = String(req.body.image || "").trim();

    if (!name || !email) return res.status(400).send("Name and email are required.");

    const duplicate = await userModel.findOne({ email, _id: { $ne: req.user.id } });
    if (duplicate) return res.status(409).send("That email is already in use.");

    await userModel.findByIdAndUpdate(req.user.id, {
      name,
      email,
      image: image || "https://i.pravatar.cc/150?img=12",
    });

    const token = jwt.sign({ email, id: req.user.id }, process.env.JWT_KEY, { expiresIn: "7d" });
    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    res.redirect("/profile");
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).send("Unable to update profile.");
  }
});

module.exports = router;
