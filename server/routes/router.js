// routes/router.js
const express = require("express");
const router = express.Router();

const { signup, login, verify } = require("../controllers/authController");

const authenticateJWT = require("../middlewares/authMiddleware");

const {
  toggleInterest,
  getCategories,
} = require("../controllers/categoryController");

router.post("/signup", signup);
router.post("/verify", verify);
router.post("/login", login);

router.get("/categories", authenticateJWT, getCategories);
router.post("/toggle-interest", authenticateJWT, toggleInterest);

module.exports = router;
