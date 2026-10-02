const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const featureController = require("../controllers/featureController");

router.get("/calendar", isLoggedIn, featureController.calendar);
router.get("/goals", isLoggedIn, featureController.goals);
router.post("/goals", isLoggedIn, featureController.createGoal);
router.post("/goals/:id/delete", isLoggedIn, featureController.deleteGoal);
router.get("/saved", isLoggedIn, featureController.saved);
router.post("/saved/:id/toggle", isLoggedIn, featureController.toggleSaved);
router.get("/opportunities/:id/match", isLoggedIn, featureController.match);
router.get("/analytics", isLoggedIn, featureController.analytics);

module.exports = router;
