const Employee = require("../models/Employee");

const generateEmployeeId = async () => {
  try {
    // Find the employee with the highest employeeId
    // Sorting as a string might fail if EMP9999 is reached, but it works fine for 4 digits.
    // For safer approach: we can use a counter collection, but this is simple and meets requirements.
    const lastEmployee = await Employee.findOne().sort({ createdAt: -1, employeeId: -1 });

    if (!lastEmployee || !lastEmployee.employeeId) {
      return "EMP0001";
    }

    const lastId = lastEmployee.employeeId;
    const numericPart = lastId.replace("EMP", "");
    const idNumber = parseInt(numericPart, 10);
    
    if (isNaN(idNumber)) {
      return "EMP0001";
    }

    const newIdNumber = idNumber + 1;
    return `EMP${newIdNumber.toString().padStart(4, "0")}`;
  } catch (error) {
    console.error("Error generating Employee ID:", error);
    throw new Error("Could not generate Employee ID");
  }
};

module.exports = generateEmployeeId;