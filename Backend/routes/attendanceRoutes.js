const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  punchIn,
  punchOut,
  getAttendance,
  getTodayAttendance,
  getWeekAttendance,
  getMonthAttendance,
  getHistoryAttendance,
  getAttendanceStats,
  startBreak,
  endBreak
} = require("../controllers/attendanceController");

router.use(authMiddleware);

router.post("/login", punchIn);
router.put("/logout", punchOut);
router.get("/", getAttendance);
router.get("/today", getTodayAttendance);
router.get("/week", getWeekAttendance);
router.get("/month", getMonthAttendance);
router.get("/history", getHistoryAttendance);
router.get("/stats", getAttendanceStats);
router.put("/break/start", startBreak);
router.put("/break/end", endBreak);

module.exports = router;
