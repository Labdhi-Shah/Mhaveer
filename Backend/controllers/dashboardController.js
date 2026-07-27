const Employee = require("../models/Employee");

// @desc    Get dashboard statistics
// @route   GET /api/dashboard
exports.getDashboardStats = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const activeEmployees = await Employee.countDocuments({ status: "Active" });
    const inactiveEmployees = await Employee.countDocuments({ status: "Inactive" });

    res.json({
      success: true,
      data: {
        totalEmployees,
        activeEmployees,
        inactiveEmployees,
      },
    });
  } catch (error) {
    console.error("Error fetching dashboard stats:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
