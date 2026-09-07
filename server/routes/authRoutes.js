const express = require("express");
const router = express.Router();

const {
  registerAdmin,
  login
} = require("../controllers/authController");

// 🔐 Protect admin creation using secret key
const checkAdminSecret = (req, res, next) => {
  const secret = req.headers["x-admin-secret"];

  if (secret !== process.env.ADMIN_SECRET) {
    return res.status(401).json({
      message: "Unauthorized access"
    });
  }

  next();
};

// 🔒 Protected route
router.post("/register-admin", checkAdminSecret, registerAdmin);

// 🔑 Login route
router.post("/login", login);

module.exports = router;