const Employee = require("../models/Employee");
const Lead = require("../models/Lead");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
      const totalEmployees = await Employee.countDocuments();
      const activeEmployees = await Employee.countDocuments({ status: "Active" });
      const inactiveEmployees = await Employee.countDocuments({ status: "Inactive" });

      return res.json({
        success: true,
        data: {
          totalEmployees,
          activeEmployees,
          inactiveEmployees,
        },
      });
    } else {
      // Front Desk / Employee role
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Filter by role hierarchy
      let filter = {};
      if (req.user.role === "Manager") {
        const teamLeaders = await Employee.find({ managerId: req.user.id, role: "Team Leader" }).select('_id');
        const tlIds = teamLeaders.map(tl => tl._id.toString());
        filter = { 
          $or: [
            { employeeId: req.user.id }, 
            { managerId: req.user.id },
            { teamLeaderId: { $in: tlIds } }
          ] 
        };
      } else if (req.user.role === "Team Leader") {
        filter = { $or: [{ employeeId: req.user.id }, { teamLeaderId: req.user.id }] };
      } else {
        filter = { employeeId: req.user.id };
      }

      const totalLeads = await Lead.countDocuments(filter);
      
      const todaysCalls = await Lead.countDocuments({
        ...filter,
        updatedAt: { $gte: today }
      });

      const interestedLeads = await Lead.countDocuments({
        ...filter,
        interested: "Yes"
      });

      const pendingFollowUps = await Lead.countDocuments({
        ...filter,
        interested: "Call Back Later",
      });

      const todaysMeetings = await Lead.countDocuments({
        ...filter,
        meetingDate: {
          $gte: today,
          $lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
        }
      });

      return res.json({
        success: true,
        data: {
          todaysCalls,
          interestedLeads,
          pendingFollowUps,
          todaysMeetings,
          totalLeads
        }
      });
    }
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
