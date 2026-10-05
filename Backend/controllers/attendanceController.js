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
      if (existingRecord.status !== "Completed") {
        return res.status(400).json({ success: false, message: "Attendance already started for today." });
      }
      return res.status(400).json({ success: false, message: "Attendance already completed for today." });
    }

    const newAttendance = new Attendance({
      employeeId,
      employeeName: employee.name || employee.firstName + " " + employee.lastName,
      officialEmail: employee.officialEmail,
      managerId: employee.managerId || "",
      managerName: employee.managerName || "",
      teamLeaderId: employee.teamLeaderId || "",
      teamLeaderName: employee.teamLeaderName || "",
      role: employee.role,
      date: getStartOfDay(),
      startTime: new Date(),
      status: "Working",
      endTime: null,
      breaks: [],
      totalBreakMinutes: 0,
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

// 2. Attendance Pause API (Lunch/Break)
exports.pauseAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getStartOfDay();

    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (!record || record.status !== "Working") {
      return res.status(400).json({ success: false, message: "No active working session to pause." });
    }

    record.status = "On Break";
    record.breaks.push({ startTime: new Date() });
    
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Attendance paused successfully.",
      data: record
    });
  } catch (error) {
    console.error("Pause Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 3. Attendance Resume API
exports.resumeAttendance = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const today = getStartOfDay();

    const record = await Attendance.findOne({
      employeeId,
      date: { $gte: today }
    });

    if (!record || record.status !== "On Break") {
      return res.status(400).json({ success: false, message: "Attendance is not currently paused." });
    }

    if (record.breaks.length > 0) {
      const lastBreak = record.breaks[record.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = new Date();
      }
    }

    record.status = "Working";
    
    await record.save();

    return res.status(200).json({
      success: true,
      message: "Attendance resumed successfully.",
      data: record
    });
  } catch (error) {
    console.error("Resume Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};


// 4. Attendance Stop API
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

    if (record.status === "On Break" && record.breaks.length > 0) {
      const lastBreak = record.breaks[record.breaks.length - 1];
      if (!lastBreak.endTime) {
        lastBreak.endTime = new Date();
      }
    }

    const endTime = new Date();
    record.endTime = endTime;
    record.status = "Completed";
    
    // Calculate total break time
    let totalBreakMs = 0;
    record.breaks.forEach((b) => {
      if (b.startTime && b.endTime) {
        totalBreakMs += (b.endTime - b.startTime);
      }
    });
    const totalBreakMins = Math.floor(totalBreakMs / 60000);
    record.totalBreakMinutes = totalBreakMins;

    // Calculate working time
    let diffMs = 0;
    if (record.startTime) {
      diffMs = record.endTime - record.startTime;
    }
    const totalWorkMins = Math.floor(diffMs / 60000) - totalBreakMins;

    const finalWorkMins = totalWorkMins > 0 ? totalWorkMins : 0;
    record.totalWorkingMinutes = finalWorkMins;
    
    const hours = Math.floor(finalWorkMins / 60);
    const minutes = finalWorkMins % 60;
    record.totalWorkingHours = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    
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

// 5. Today's Attendance API
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
        }
      });
    }

    return res.status(200).json({
      success: true,
      message: "Today's attendance fetched.",
      data: {
        attendanceStarted: true,
        loginTime: record.loginTime,
        logoutTime: record.logoutTime,
      }
    });
  } catch (error) {
    console.error("Get Today Attendance Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error.", error: error.message });
  }
};

// 6. Attendance History API
exports.getAttendanceHistory = async (req, res) => {
  try {
    const employeeId = req.user.id;
    const { page = 1, limit = 10, employeeName, status, startDate, endDate, range } = req.query;
    
    let query = {};
    
    if (req.user.role !== "SuperAdmin" && req.user.role !== "Admin" && req.user.role !== "Administration (Admin)" && req.user.role !== "Manager") {
      let hierarchyFilter = {};
      if (req.user.role === "Manager") {
        const teamLeaders = await Employee.find({ managerId: req.user.id, role: "Team Leader" }).select('_id');
        const tlIds = teamLeaders.map(tl => tl._id.toString());
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { managerId: req.user.id },
            { teamLeaderId: { $in: tlIds } }
          ]
        };
      } else if (req.user.role === "Team Leader") {
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { teamLeaderId: req.user.id }
          ]
        };
      } else {
        hierarchyFilter = { employeeId: req.user.id };
      }
      Object.assign(query, hierarchyFilter);
    }
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: "i" };
    }
    
    if (status) {
      query.status = status;
    }

    const now = new Date();
    let sDate, eDate;

    if (range === "Today") {
      sDate = getStartOfDay();
      eDate = new Date(sDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (range === "This Week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      sDate = new Date(now.setDate(diff));
      sDate.setHours(0, 0, 0, 0);
      eDate = new Date();
    } else if (range === "Last Week") {
      const day = now.getDay();
      const diff = now.getDate() - day - 6;
      sDate = new Date(now.setDate(diff));
      sDate.setHours(0, 0, 0, 0);
      eDate = new Date(sDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (range === "This Month") {
      sDate = new Date(now.getFullYear(), now.getMonth(), 1);
      eDate = new Date();
    } else if (range === "Last Month") {
      sDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      eDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (startDate || endDate) {
      if (startDate) sDate = new Date(startDate);
      if (endDate) {
        eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
      }
    }

    if (sDate || eDate) {
      query.date = {};
      if (sDate) query.date.$gte = sDate;
      if (eDate) query.date.$lte = eDate;
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

// 7. Admin Attendance API
exports.getAdminAttendance = async (req, res) => {
  try {
    const { page = 1, limit = 10, employeeName, employeeId, status, startDate, endDate, range } = req.query;
    
    let query = {};

    if (req.user && req.user.role !== "SuperAdmin" && req.user.role !== "Admin") {
      let hierarchyFilter = {};
      if (req.user.role === "Manager") {
        const teamLeaders = await Employee.find({ managerId: req.user.id, role: "Team Leader" }).select('_id');
        const tlIds = teamLeaders.map(tl => tl._id.toString());
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { managerId: req.user.id },
            { teamLeaderId: { $in: tlIds } }
          ]
        };
      } else if (req.user.role === "Team Leader") {
        hierarchyFilter = {
          $or: [
            { employeeId: req.user.id },
            { teamLeaderId: req.user.id }
          ]
        };
      } else {
        hierarchyFilter = { employeeId: req.user.id };
      }
      Object.assign(query, hierarchyFilter);
    }
    
    if (employeeName) {
      query.employeeName = { $regex: employeeName, $options: "i" };
    }
    if (employeeId) {
      query.employeeId = employeeId;
    }
    if (status) {
      query.status = status;
    }

    const now = new Date();
    let sDate, eDate;

    if (range === "Today") {
      sDate = getStartOfDay();
      eDate = new Date(sDate.getTime() + 24 * 60 * 60 * 1000);
    } else if (range === "This Week") {
      const day = now.getDay();
      const diff = now.getDate() - day + (day === 0 ? -6 : 1);
      sDate = new Date(now.setDate(diff));
      sDate.setHours(0, 0, 0, 0);
      eDate = new Date();
    } else if (range === "Last Week") {
      const day = now.getDay();
      const diff = now.getDate() - day - 6;
      sDate = new Date(now.setDate(diff));
      sDate.setHours(0, 0, 0, 0);
      eDate = new Date(sDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    } else if (range === "This Month") {
      sDate = new Date(now.getFullYear(), now.getMonth(), 1);
      eDate = new Date();
    } else if (range === "Last Month") {
      sDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      eDate = new Date(now.getFullYear(), now.getMonth(), 1);
    } else if (startDate || endDate) {
      if (startDate) sDate = new Date(startDate);
      if (endDate) {
        eDate = new Date(endDate);
        eDate.setHours(23, 59, 59, 999);
      }
    }

    if (sDate || eDate) {
      query.date = {};
      if (sDate) query.date.$gte = sDate;
      if (eDate) query.date.$lte = eDate;
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