const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getBanks } = require("../controllers/bankController");

// Accessible to authenticated users
router.use(authMiddleware);

router.get("/", getBanks);

module.exports = router;
