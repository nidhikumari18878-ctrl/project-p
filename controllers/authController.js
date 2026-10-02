const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

exports.showregister = (req, res) => res.render("register");

exports.register = async (req, res) => {
  try {
    const name = String(req.body.name || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");
    const confirmPassword = String(req.body.confirmPassword || "");

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).render("register", { error: "Please fill all fields." });
    }

    if (password.length < 6) {
      return res.status(400).render("register", { error: "Password must be at least 6 characters." });
    }

    if (password !== confirmPassword) {
      return res.status(400).render("register", { error: "Passwords do not match." });
    }

    const existingUser = await userModel.findOne({ email });
    if (existingUser) {
      return res.status(409).render("register", { error: "An account with this email already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    await userModel.create({ name, email, password: hashedPassword });

    return res.redirect("/login?registered=1");
  } catch (error) {
    console.error("Register error:", error);
    return res.status(500).render("register", { error: "Unable to create your account right now." });
  }
};

exports.showLogin = (req, res) => res.render("login");

exports.login = async (req, res) => {
  try {
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).render("login", { error: "Email and password are required." });
    }

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).render("login", { error: "Invalid email or password." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).render("login", { error: "Invalid email or password." });
    }

    if (!process.env.JWT_KEY) {
      throw new Error("JWT_KEY is not configured.");
    }

    const token = jwt.sign(
      { email: user.email, id: user._id.toString() },
      process.env.JWT_KEY,
      { expiresIn: "7d" }
    );

    res.cookie("token", token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.redirect("/dashboard");
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).render("login", { error: "Unable to log in right now." });
  }
};
