const jwt = require("jsonwebtoken");

const generateToken = (user) => jwt.sign(
  { email: user.email, id: user._id.toString() },
  process.env.JWT_KEY,
  { expiresIn: "7d" }
);

module.exports = generateToken;
