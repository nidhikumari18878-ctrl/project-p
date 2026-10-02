const express = require("express");
const router = express.Router();

const isLoggedIn = require("../middlewares/isLoggedIn");
const profileController = require("../controllers/profileController");

router.get(
    "/profile",
    isLoggedIn,
    profileController.getProfile
);

module.exports = router;
