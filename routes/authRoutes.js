const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
router.get('/register',authController.showregister)
router.post('/register', authController.register);

router.get('/login',authController.showLogin);
router.post('/login', authController.login);
module.exports = router;