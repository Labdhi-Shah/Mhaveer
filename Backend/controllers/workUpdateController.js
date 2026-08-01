const WorkUpdate = require("../models/WorkUpdate");
const Employee = require("../models/Employee");

// @desc    Submit daily work update
// @route   POST /api/work-updates
// @access  Private
exports.createWorkUpdate = async (req, res) => {
  try {
    const { title, description, date, status } = req.body;

    if (!title || !description || !date) {
      return res.status(400).json({ success: false, message: "Title, Description, and Date are required" });
    }

    const employee = await Employee.findById(req.user.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee profile not found" });
    }

    const newUpdate = new WorkUpdate({
      employeeDbId: req.user.id,
      employeeId: employee.employeeId,
      employeeName: employee.name,
      teamName: employee.department || "No Department",
      title,
      description,
      date: new Date(date),
      status: status || "Completed",
    });

    await newUpdate.save();

    res.status(201).json({
      success: true,
      message: "Work update submitted successfully",
      data: newUpdate,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("Create Work Update Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Get work updates with filters, search, sorting & pagination
// @route   GET /api/work-updates
// @access  Private
exports.getWorkUpdates = async (req, res) => {
  try {
    let filter = {};

    // Role-based access control
    if (req.user.role === "SuperAdmin" || req.user.role === "Admin") {
      filter = {}; // Admin sees all
    } else if (req.user.role === "Team Leader") {
      // Find all employees reporting to this Team Leader
      const teamEmployees = await Employee.find({ teamLeaderId: req.user.id }).select("_id");
      const allowedIds = [req.user.id, ...teamEmployees.map((emp) => emp._id.toString())];
      filter = { employeeDbId: { $in: allowedIds } };
    } else {
      // Standard employee sees only their own updates
      filter = { employeeDbId: req.user.id };
    }

    // Search query (on title, description, employeeName, employeeId)
    const search = req.query.search;
    if (search) {
      const searchRegex = { $regex: search, $options: "i" };
      filter.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { employeeName: searchRegex },
        { employeeId: searchRegex }
      ];
    }

    // Filter by Status
    if (req.query.status) {
      filter.status = req.query.status;
    }

    // Filter by Team Name
    if (req.query.teamName) {
      filter.teamName = req.query.teamName;
    }

    // Filter by Date Range
    if (req.query.startDate || req.query.endDate) {
      filter.date = {};
      if (req.query.startDate) {
        filter.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        filter.date.$lte = new Date(req.query.endDate);
      }
    }

    // Sorting
    let sort = {};
    if (req.query.sortBy) {
      const order = req.query.sortOrder === "asc" ? 1 : -1;
      sort[req.query.sortBy] = order;
    } else {
      sort.date = -1; // Default sort by date descending
    }

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const updates = await WorkUpdate.find(filter).sort(sort).skip(skip).limit(limit);
    const total = await WorkUpdate.countDocuments(filter);
    const pages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      message: "Work updates fetched successfully",
      data: updates,
      total,
      pages: pages || 1,
      currentPage: page
    });
  } catch (error) {
    console.error("Get Work Updates Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Update daily work update
// @route   PUT /api/work-updates/:id
// @access  Private
exports.updateWorkUpdate = async (req, res) => {
  try {
    const { title, description, date, status } = req.body;
    let update = await WorkUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: "Work update record not found" });
    }

    // Check authorization: Owner only can edit their own updates
    if (update.employeeDbId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to modify this update" });
    }

    update.title = title || update.title;
    update.description = description || update.description;
    update.date = date ? new Date(date) : update.date;
    update.status = status || update.status;

    await update.save();

    res.status(200).json({
      success: true,
      message: "Work update modified successfully",
      data: update,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({ success: false, message: messages.join(", ") });
    }
    console.error("Update Work Update Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};

// @desc    Delete daily work update
// @route   DELETE /api/work-updates/:id
// @access  Private
exports.deleteWorkUpdate = async (req, res) => {
  try {
    const update = await WorkUpdate.findById(req.params.id);

    if (!update) {
      return res.status(404).json({ success: false, message: "Work update record not found" });
    }

    // Check authorization: Owner only can delete their own updates
    if (update.employeeDbId.toString() !== req.user.id) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this update" });
    }

    await update.deleteOne();

    res.status(200).json({
      success: true,
      message: "Work update deleted successfully",
      data: {},
    });
  } catch (error) {
    console.error("Delete Work Update Error:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
