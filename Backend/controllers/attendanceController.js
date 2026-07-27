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
