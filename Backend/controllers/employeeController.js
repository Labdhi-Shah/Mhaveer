const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const generateEmployeeId = require("../utils/generateId");
const generatePassword = require("../utils/generatePassword");

// @desc    Create new employee
// @route   POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const { fullName, personalEmail, phone, role, address, joiningDate, dateOfBirth } = req.body;

    // Validation
    if (!fullName || !personalEmail || !phone || !role) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    // Auto-generate email based on first name
    const firstName = fullName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let generatedEmail = `${firstName}@mhaveer.com`;
    let emailExists = await Employee.findOne({ email: generatedEmail });
    let counter = 1;
    
    while (emailExists) {
      generatedEmail = `${firstName}${counter}@mhaveer.com`;
      emailExists = await Employee.findOne({ email: generatedEmail });
      counter++;
    }

    const email = generatedEmail;

    // Auto-generate employeeId and password
    const employeeId = await generateEmployeeId();
    const temporaryPassword = generatePassword();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    // Create Employee
    const newEmployee = new Employee({
      employeeId,
      fullName,
      personalEmail,
      email,
      phone,
      role,
      address,
      joiningDate,
      dateOfBirth,
      password: hashedPassword,
    });

    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        employeeId: newEmployee.employeeId,
        email: newEmployee.email, // Return generated email to frontend
        temporaryPassword, // Required by instructions to show to admin once
      },
    });
  } catch (error) {
    console.error("Error creating employee:", error);
    res.status(500).json({ success: false, message: error.message || "Server Error" });
  }
};

// @desc    Get all employees
// @route   GET /api/employees
exports.getEmployees = async (req, res) => {
  try {
    const { search, sort = "-createdAt", page = 1, limit = 10 } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await Employee.find(query)
      .select("-password")
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    res.json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: employees,
    });
  } catch (error) {
    console.error("Error fetching employees:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Get single employee
// @route   GET /api/employees/:id
exports.getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id).select("-password");
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }
    res.json({ success: true, data: employee });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    // Fields that are allowed to be updated
    const { fullName, email, phone, role, address, joiningDate, dateOfBirth, status } = req.body;

    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if new email is already in use by another employee
    if (email && email !== employee.email) {
      const existingEmail = await Employee.findOne({ email });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Email already in use" });
      }
    }

    employee.fullName = fullName || employee.fullName;
    employee.email = email || employee.email;
    employee.phone = phone || employee.phone;
    employee.role = role || employee.role;
    employee.address = address || employee.address;
    employee.joiningDate = joiningDate || employee.joiningDate;
    employee.dateOfBirth = dateOfBirth || employee.dateOfBirth;
    if (status) employee.status = status;

    await employee.save();

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        fullName: employee.fullName,
        email: employee.email,
        role: employee.role,
        status: employee.status,
      }
    });
  } catch (error) {
    console.error("Error updating employee:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Delete employee
// @route   DELETE /api/employees/:id
exports.deleteEmployee = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    await employee.deleteOne();
    res.json({ success: true, message: "Employee removed successfully" });
  } catch (error) {
    console.error("Error deleting employee:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
