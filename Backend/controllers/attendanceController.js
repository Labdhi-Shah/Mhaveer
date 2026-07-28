const Attendance = require("../models/Attendance");
const Employee = require("../models/Employee"); // Assume Employee model exists

// Utility to get start of day
const getStartOfDay = (date = new Date()) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

// 1. Attendance Start API
exports.startAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const employee = await Employee.findById(employeeId);
    
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found." });
    }

    const today = getStartOfDay();

    const existingRecord = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (existingRecord) {
      if (existingRecord.status === "Working") {
        return res.status(400).json({ success: false, message: "Attendance already started." });
      }
      if (existingRecord.status === "Completed") {
        return res.status(400).json({ success: false, message: "Attendance already completed for today." });
      }
    }

    const newAttendance = new Attendance({
      employeeId,
      employeeName: employee.name || employee.firstName + " " + employee.lastName,
      date: new Date(),
      startTime: new Date(),
      status: "Working",
      endTime: null,
      totalWorkingMinutes: 0,
      totalWorkingHours: "00:00"
    });

    await newAttendance.save();

    return res.status(201).json({
      success: true,
      message: "Attendance started successfully.",
      data: newAttendance
    });
  } catch (error) {
    console.error("Start Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 2. Attendance Stop API
exports.stopAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getStartOfDay();

    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: "No active attendance record found for today." });
    }

    if (record.status === "Completed") {
      return res.status(400).json({ success: false, message: "Attendance already completed for today." });
    }

    const endTime = new Date();
    record.endTime = endTime;
    
    const diffMs = endTime - record.startTime;
    const diffMins = Math.floor(diffMs / 60000);
    record.totalWorkingMinutes = diffMins;
    
    const hours = Math.floor(diffMins / 60);
    const minutes = diffMins % 60;
    record.totalWorkingHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
    record.status = "Completed";

    await record.save();

    return res.status(200).json({
      success: true,
      message: "Attendance stopped successfully.",
      data: record
    });
  } catch (error) {
    console.error("Stop Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 3. Today's Attendance API
exports.getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getStartOfDay();

    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (!record) {
      return res.status(200).json({
        success: true,
        message: "No attendance started for today.",
        data: {
          attendanceStarted: false,
          status: null
        }
      });
    }

    let elapsedSeconds = 0;
    if (record.status === "Working") {
      elapsedSeconds = Math.floor((new Date() - record.startTime) / 1000);
    }

    return res.status(200).json({
      success: true,
      message: "Today's attendance fetched.",
      data: {
        attendanceStarted: true,
        status: record.status,
        startTime: record.startTime,
        endTime: record.endTime,
        totalWorkingHours: record.totalWorkingHours,
        elapsedSeconds
      }
    });
  } catch (error) {
    console.error("Get Today Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 4. Attendance History API
exports.getAttendanceHistory = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { page = 1, limit = 10, employeeName, status, startDate, endDate } = req.query;
    
    const query = { employeeId };
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: "i" };
    }
    
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "Attendance history fetched.",
      data: {
        records,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Get Attendance History Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 5. Admin Attendance API
exports.getAdminAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeName, employeeId, status, startDate, endDate } = req.query;
    
    const query = {};
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: "i" };
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (status) {
      query.status = status;
    }
    
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        query.date.$lte = end;
      }
    }

    const skip = (page - 1) * limit;

    const total = await Attendance.countDocuments(query);
    const records = await Attendance.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    return res.status(200).json({
      success: true,
      message: "All attendance records fetched.",
      data: {
        records,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error("Admin Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};
