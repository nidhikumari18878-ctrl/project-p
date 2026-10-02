const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const dashboardController = require("../controllers/dashboardController");

router.get("/dashboard", isLoggedIn, dashboardController.getDashboard);

module.exports = router;
