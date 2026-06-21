// authRoutes.js
const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

router.post("/signup", authController.signup);
router.post("/login", authController.login);
router.post("/logout", authController.logout);

// Protected route (optional)
router.get("/profile", authMiddleware, authController.getProfile);

// Backward compatible
router.post("/register", authController.register);


module.exports = router;