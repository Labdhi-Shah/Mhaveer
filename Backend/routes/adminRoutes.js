const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const { getAdminAttendance } = require("../controllers/attendanceController");

router.use(authMiddleware);
router.use(authMiddleware.authorize("Manager", "Administration (Admin)", "Admin", "SuperAdmin"));

// Endpoint: GET /api/admin/attendance
router.get("/attendance", getAdminAttendance);

module.exports = router;
