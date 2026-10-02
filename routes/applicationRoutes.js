const express = require("express");
const router = express.Router();
const isLoggedIn = require("../middlewares/isLoggedIn");
const applicationController = require("../controllers/applicationController");

router.get("/application", isLoggedIn, applicationController.list);
router.post("/application", isLoggedIn, applicationController.create);
router.post("/application/:id/status", isLoggedIn, applicationController.updateStatus);
router.post("/application/:id/delete", isLoggedIn, applicationController.remove);

module.exports = router;
