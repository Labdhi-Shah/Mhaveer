const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee");

// @desc    Employee Punch In (Save Login Time)
// @route   POST /api/attendance/login
exports.punchIn = async (req, res) => {
  try {
    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if already punched in today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const existingAttendance = await Attendance.findOne({
      employeeId: employee._id.toString(),
      date: { $gte: today },
    });

    if (existingAttendance) {
      return res.status(400).json({ success: false, message: "Already punched in for today", data: { loginTime: existingAttendance.loginTime } });
    }

    const attendance = new Attendance({
      employeeId: employee._id.toString(),
      employeeName: employee.name,
      officialEmail: employee.officialEmail,
      role: employee.role,
      branch: employee.branch || "",
      loginTime: new Date(),
    });

    await attendance.save();

    res.status(201).json({
      success: true,
      message: "Punched in successfully",
      data: {
        loginTime: attendance.loginTime,
      },
    });
  } catch (error) {
    console.error("Punch In Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Employee Punch Out (Save Logout Time & Calculate Hours)
// @route   PUT /api/attendance/logout
exports.punchOut = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employeeId: req.user.id,
      date: { $gte: today },
    });

    if (!attendance) {
      return res.status(404).json({ success: false, message: "No attendance record found for today. Please punch in first." });
    }

    if (attendance.logoutTime) {
      return res.status(400).json({ success: false, message: "Already punched out for today" });
    }

    attendance.logoutTime = new Date();

    // Calculate working hours
    const diffMs = attendance.logoutTime - attendance.loginTime;
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    attendance.workingHours = `${diffHrs.toString().padStart(2, '0')}:${diffMins.toString().padStart(2, '0')}`;

    await attendance.save();

    res.status(200).json({
      success: true,
      message: "Punched out successfully",
      data: attendance,
    });
  } catch (error) {
    console.error("Punch Out Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get Employee Attendance
// @route   GET /api/attendance
exports.getAttendance = async (req, res) => {
  try {
    let query = {};
    
    // If regular employee, only see own attendance
    if (req.user.role !== "SuperAdmin") {
      query.employeeId = req.user.id;
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.status(200).json({
      success: true,
      message: "Attendance fetched successfully",
      data: records,
    });
  } catch (error) {
    console.error("Get Attendance Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// Helper functions
const parseTimeToMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const [h, m] = timeStr.split(':').map(Number);
  return (h || 0) * 60 + (m || 0);
};

const formatMinutesToTime = (totalMins) => {
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
};

const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

exports.getTodayAttendance = async (req, res) => {
  try {
    const today = getStartOfDay();
    const records = await Attendance.find({
      employeeId: req.user.id,
      date: { $gte: today }
    }).sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getWeekAttendance = async (req, res) => {
  try {
    const today = new Date();
    const firstDayOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1))); // Monday
    firstDayOfWeek.setHours(0, 0, 0, 0);

    const records = await Attendance.find({
      employeeId: req.user.id,
      date: { $gte: firstDayOfWeek }
    }).sort({ date: 1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getMonthAttendance = async (req, res) => {
  try {
    const date = new Date();
    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);

    const records = await Attendance.find({
      employeeId: req.user.id,
      date: { $gte: firstDay }
    }).sort({ date: 1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getHistoryAttendance = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    let query = { employeeId: req.user.id };
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const records = await Attendance.find(query).sort({ date: -1 });

    res.status(200).json({ success: true, data: records });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.getAttendanceStats = async (req, res) => {
  try {
    const allRecords = await Attendance.find({ employeeId: req.user.id }).sort({ date: 1 });
    
    let totalMinutes = 0;
    let totalDays = allRecords.length;
    let maxMinutes = 0;
    let minMinutes = Infinity;

    const today = getStartOfDay();
    let todayMinutes = 0;

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - weekStart.getDay() + (weekStart.getDay() === 0 ? -6 : 1));
    weekStart.setHours(0,0,0,0);
    let weekMinutes = 0;

    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    let monthMinutes = 0;

    const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0, 23, 59, 59);
    let lastMonthMinutes = 0;

    allRecords.forEach(record => {
      let mins = 0;
      if (record.workingHours) {
        mins = parseTimeToMinutes(record.workingHours);
      } else if (record.loginTime) {
        // Live session calculation
        const elapsedMs = Date.now() - new Date(record.loginTime).getTime();
        mins = Math.floor(elapsedMs / (1000 * 60));
      }

      totalMinutes += mins;

      if (mins > maxMinutes) maxMinutes = mins;
      if (mins < minMinutes && mins > 0) minMinutes = mins;

      const recordDate = new Date(record.date);
      
      if (recordDate >= today) todayMinutes += mins;
      if (recordDate >= weekStart) weekMinutes += mins;
      if (recordDate >= monthStart) monthMinutes += mins;
      if (recordDate >= lastMonthStart && recordDate <= lastMonthEnd) lastMonthMinutes += mins;
    });

    if (minMinutes === Infinity) minMinutes = 0;

    const avgDailyMinutes = totalDays > 0 ? Math.floor(totalMinutes / totalDays) : 0;

    res.status(200).json({
      success: true,
      data: {
        totalWorkingHours: formatMinutesToTime(totalMinutes),
        todayWorkingTime: formatMinutesToTime(todayMinutes),
        thisWeekWorkingTime: formatMinutesToTime(weekMinutes),
        thisMonthWorkingTime: formatMinutesToTime(monthMinutes),
        lastMonthWorkingTime: formatMinutesToTime(lastMonthMinutes),
        averageDailyHours: formatMinutesToTime(avgDailyMinutes),
        totalLoginDays: totalDays,
        longestWorkingDay: formatMinutesToTime(maxMinutes),
        shortestWorkingDay: formatMinutesToTime(minMinutes)
      }
    });
  } catch (error) {
    console.error("Stats Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.startBreak = async (req, res) => {
  try {
    const { attendanceId } = req.body;
    if (!attendanceId) return res.status(400).json({ success: false, message: "Attendance ID required" });

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ success: false, message: "Attendance not found" });

    // Check if already on break
    if (attendance.breaks.length > 0 && !attendance.breaks[attendance.breaks.length - 1].endTime) {
      return res.status(400).json({ success: false, message: "Already on break" });
    }

    attendance.breaks.push({ startTime: new Date() });
    await attendance.save();

    res.status(200).json({ success: true, message: "Break started" });
  } catch (error) {
    console.error("Start Break Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

exports.endBreak = async (req, res) => {
  try {
    const { attendanceId } = req.body;
    if (!attendanceId) return res.status(400).json({ success: false, message: "Attendance ID required" });

    const attendance = await Attendance.findById(attendanceId);
    if (!attendance) return res.status(404).json({ success: false, message: "Attendance not found" });

    if (attendance.breaks.length === 0 || attendance.breaks[attendance.breaks.length - 1].endTime) {
      return res.status(400).json({ success: false, message: "Not on break" });
    }

    const currentBreak = attendance.breaks[attendance.breaks.length - 1];
    currentBreak.endTime = new Date();

    // Recalculate total break time
    let totalMins = 0;
    attendance.breaks.forEach(b => {
      if (b.startTime && b.endTime) {
        totalMins += Math.floor((b.endTime - b.startTime) / 60000);
      }
    });

    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    attendance.totalBreakTime = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;

    await attendance.save();

    res.status(200).json({ success: true, message: "Break ended", data: { totalBreakTime: attendance.totalBreakTime } });
  } catch (error) {
    console.error("End Break Error:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
