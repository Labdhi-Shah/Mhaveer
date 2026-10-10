const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getTeamPerformance, getEmployeeLeads } = require("../controllers/teamPerformanceController");

router.get("/", authMiddleware, getTeamPerformance);
router.get("/:employeeId/leads", authMiddleware, getEmployeeLeads);

module.exports = router;