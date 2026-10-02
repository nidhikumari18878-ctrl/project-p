const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
    const token = req.cookies.token;

    if (!token) {
        return res.redirect("/login");
    }

    try {
        const decoded = jwt.verify(
            token,
            process.env.JWT_KEY
        );

        req.user = decoded;

        next();
    } catch (err) {
        console.log(err);
        return res.redirect("/login");
    }
};