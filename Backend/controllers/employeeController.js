const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");
const generateEmployeeId = require("../utils/generateId");
const generatePassword = require("../utils/generatePassword");

// @desc    Create new employee
// @route   POST /api/employees
exports.createEmployee = async (req, res) => {
  try {
    const { fullName, name, personalEmail, phone, role, address, joiningDate, dateOfBirth, dob } = req.body;

    const empName = fullName || name;
    const empDob = dateOfBirth || dob;

    // Validation
    if (!empName || !personalEmail || !phone || !role) {
      return res.status(400).json({ success: false, message: "Please provide all required fields" });
    }

    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number." });
    }

    // Auto-generate official login email based on first name
    const firstName = empName.split(' ')[0].toLowerCase().replace(/[^a-z0-9]/g, '');
    let generatedEmail = `${firstName}@mhaveer.com`;
    let emailExists = await Employee.findOne({ officialEmail: generatedEmail });
    let counter = 1;
    
    while (emailExists) {
      generatedEmail = `${firstName}${counter}@mhaveer.com`;
      emailExists = await Employee.findOne({ officialEmail: generatedEmail });
      counter++;
    }

    const officialEmail = generatedEmail;

    // Auto-generate employeeId and password
    const employeeId = await generateEmployeeId();
    const temporaryPassword = generatePassword();

    // Hash the password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(temporaryPassword, salt);

    // Create Employee
    const newEmployee = new Employee({
      employeeId,
      name: empName,
      personalEmail,
      officialEmail,
      phone,
      role,
      address,
      joiningDate,
      dob: empDob,
      password: hashedPassword,
    });

    await newEmployee.save();

    res.status(201).json({
      success: true,
      message: "Employee created successfully",
      data: {
        employeeId: newEmployee.employeeId,
        email: newEmployee.officialEmail, // Return generated email to frontend as 'email'
        officialEmail: newEmployee.officialEmail,
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
        { name: { $regex: search, $options: "i" } },
        { officialEmail: { $regex: search, $options: "i" } },
        { personalEmail: { $regex: search, $options: "i" } },
        { employeeId: { $regex: search, $options: "i" } },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const employees = await Employee.find(query)
      .select("-password") // Do not return password
      .sort(sort)
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Employee.countDocuments(query);

    // Map to required output, keeping legacy fields for frontend
    const formattedData = employees.map(emp => ({
      _id: emp._id,
      employeeId: emp.employeeId,
      name: emp.name,
      fullName: emp.name,
      personalEmail: emp.personalEmail,
      email: emp.personalEmail, // API requirement: Do not return officialEmail here, send personalEmail to frontend table
      phone: emp.phone,
      role: emp.role,
      status: emp.status
    }));

    res.json({
      success: true,
      count: employees.length,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: formattedData,
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

    const formattedData = {
      _id: employee._id,
      employeeId: employee.employeeId,
      name: employee.name,
      fullName: employee.name,
      personalEmail: employee.personalEmail,
      officialEmail: employee.officialEmail,
      email: employee.officialEmail, // map for existing frontend that uses email field
      phone: employee.phone,
      role: employee.role,
      address: employee.address,
      dob: employee.dob,
      dateOfBirth: employee.dob,
      joiningDate: employee.joiningDate,
      status: employee.status
    };

    res.json({ success: true, data: formattedData });
  } catch (error) {
    console.error("Error fetching employee:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// @desc    Update employee
// @route   PUT /api/employees/:id
exports.updateEmployee = async (req, res) => {
  try {
    const { fullName, name, email, officialEmail, personalEmail, phone, role, address, joiningDate, dateOfBirth, dob, status } = req.body;
    
    const empName = fullName || name;
    const empDob = dateOfBirth || dob;
    const offEmail = officialEmail || email;

    if (phone) {
      const phoneRegex = /^[6-9]\d{9}$/;
      if (!phoneRegex.test(phone)) {
        return res.status(400).json({ success: false, message: "Please enter a valid 10-digit Indian mobile number." });
      }
    }

    let employee = await Employee.findById(req.params.id);
    if (!employee) {
      return res.status(404).json({ success: false, message: "Employee not found" });
    }

    // Check if new official email is already in use
    if (offEmail && offEmail !== employee.officialEmail) {
      const existingEmail = await Employee.findOne({ officialEmail: offEmail });
      if (existingEmail) {
        return res.status(400).json({ success: false, message: "Official Email already in use" });
      }
    }

    employee.name = empName || employee.name;
    employee.officialEmail = offEmail || employee.officialEmail;
    employee.personalEmail = personalEmail || employee.personalEmail;
    employee.phone = phone || employee.phone;
    employee.role = role || employee.role;
    employee.address = address || employee.address;
    employee.joiningDate = joiningDate || employee.joiningDate;
    employee.dob = empDob || employee.dob;
    if (status) employee.status = status;

    await employee.save();

    res.json({
      success: true,
      message: "Employee updated successfully",
      data: {
        _id: employee._id,
        employeeId: employee.employeeId,
        name: employee.name,
        fullName: employee.name,
        personalEmail: employee.personalEmail,
        officialEmail: employee.officialEmail,
        email: employee.officialEmail,
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
