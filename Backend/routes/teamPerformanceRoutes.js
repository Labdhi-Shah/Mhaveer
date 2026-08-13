const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getTeamPerformance } = require("../controllers/teamPerformanceController");

router.get("/", authMiddleware, getTeamPerformance);

module.exports = router;