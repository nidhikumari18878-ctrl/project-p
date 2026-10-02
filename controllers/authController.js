const userModel = require("../models/user");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
exports.showregister = (req, res) => {
  res.render("register");
};
// Register
exports.register = async (req, res) => {
  try {
     
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.send("Please fill all fields");
    }

    const existingUser = await userModel.findOne({ email });

    if (existingUser) { 
     return res.redirect("/login")
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await userModel.create({
      name,
      email,
      password: hashedPassword,
    });

    res.redirect("/login")
  }catch (error) {
    console.log(error);
    res.send(error);
}
};

// Login Page
exports.showLogin = (req, res) => {
  res.render("login");
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.send("Email aur Password required hai");
    }

    const user = await userModel.findOne({ email });

    // User not found
    if (!user) {
      return res.send("no account exist");
    }

    // Password check
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.send("something went wrong");
    }

    // JWT Token
    const token = jwt.sign(
      {
        email: user.email,
        id: user._id,
      },
      process.env.JWT_KEY
    );

    // Cookie set
    res.cookie("token", token, {
      httpOnly: true,
    });

    // Dashboard open
    return res.redirect("/dashboard");

  } catch (error) {
    console.log(error);
    res.send(error);
}
};