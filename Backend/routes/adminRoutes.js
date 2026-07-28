const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getAdminAttendance } = require("../controllers/attendanceController");

router.use(authMiddleware);

// Endpoint: GET /api/admin/attendance
router.get("/attendance", getAdminAttendance);

module.exports = router;
