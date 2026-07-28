const express = require("express");
const router = express.Router();

const { login, changePassword, logout } = require("../controllers/authController");

router.post("/login", login);
router.post("/logout", logout);
router.post("/change-password", changePassword);

module.exports = router;