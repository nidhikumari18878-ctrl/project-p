const jwt = require("jsonwebtoken");

module.exports = function isLoggedIn(req, res, next) {
  const token = req.cookies.token;

  if (!token) return res.redirect("/login");
  if (!process.env.JWT_KEY) return res.status(500).send("JWT_KEY is not configured");

  try {
    const decoded = jwt.verify(token, process.env.JWT_KEY);
    req.user = { ...decoded, id: decoded.id || decoded.userid };
    if (!req.user.id) {
      res.clearCookie("token");
      return res.redirect("/login");
    }
    return next();
  } catch (err) {
    res.clearCookie("token");
    return res.redirect("/login");
  }
};
