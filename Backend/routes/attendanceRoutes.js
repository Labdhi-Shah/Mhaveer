const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  startAttendance,
  pauseAttendance,
  resumeAttendance,
  stopAttendance,
  getTodayAttendance,
  getAttendanceHistory,
  getAdminAttendance
} = require("../controllers/attendanceController");

router.use(authMiddleware);

router.post("/start", startAttendance);
router.post("/pause", pauseAttendance);
router.post("/resume", resumeAttendance);
router.post("/stop", stopAttendance);
router.get("/today", getTodayAttendance);
router.get("/", getAttendanceHistory);
router.get("/admin", getAdminAttendance);

module.exports = router;