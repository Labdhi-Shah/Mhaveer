const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getMeetings,
  getSingleMeeting,
  updateMeeting,
  deleteMeeting,
  getSalesDashboardStats,
  getSalesEmployeeMyStats,
  assignUnassignedMeetings,
} = require("../controllers/meetingController");

// Protect all meeting routes with JWT authentication
router.use(authMiddleware);

// ── Sales-specific routes (must come before /:id param routes) ─────────────

// Sales Manager / Team Leader: get per-employee capacity overview
router.get("/sales-dashboard-stats", getSalesDashboardStats);

// Sales Employee (any Sales role): get personal meeting stats
router.get("/sales-employee-stats", getSalesEmployeeMyStats);

// Sales Manager: trigger assignment of all unassigned meetings
router.post("/assign-unassigned", assignUnassignedMeetings);

// ── Standard CRUD routes ───────────────────────────────────────────────────
router.get("/", getMeetings);
router.get("/:id", getSingleMeeting);
router.put("/:id", updateMeeting);
router.delete("/:id", deleteMeeting);

module.exports = router;