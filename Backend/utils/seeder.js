const bcrypt = require("bcryptjs");
const Employee = require("../models/Employee");

const seedData = [
  {
    employeeId: "EMP-SALES-01",
    name: "Sales User",
    personalEmail: "sales.personal@mhaveerfincap.com",
    officialEmail: "sales@mhaveerfincap.com",
    phone: "9988776653",
    role: "Sales Department",
    department: "Sales Department",
    password: "Sales@123",
    status: "Active"
  },
  {
    employeeId: "EMP-TL-01",
    name: "Team Leader User",
    personalEmail: "tl.personal@mhaveerfincap.com",
    officialEmail: "tl@mhaveerfincap.com",
    phone: "9988776654",
    role: "Team Leader",
    department: "Sales Department",
    password: "TL@123",
    status: "Active"
  },
  {
    employeeId: "EMP-HR-01",
    name: "HR User",
    personalEmail: "hr.personal@mhaveerfincap.com",
    officialEmail: "hr@mhaveerfincap.com",
    phone: "9988776655",
    role: "Human Resources (HR)",
    department: "HR Department",
    password: "HR@123",
    status: "Active"
  },
  {
    employeeId: "EMP-ADMIN-01",
    name: "Admin User",
    personalEmail: "admin.personal@mhaveerfincap.com",
    officialEmail: "admin@mhaveerfincap.com",
    phone: "9988776656",
    role: "SuperAdmin",
    department: "Administration",
    password: "123456",
    status: "Active"
  }
];

const seedUsers = async () => {
  try {
    console.log("Checking DB for seed users...");
    
    // Clean up seed users if they exist to completely remove them first, preventing duplicates or outdated values
    await Employee.deleteMany({ 
      $or: [
        { officialEmail: { 
          $in: [
            "sales@mhaveerfincap.com",
            "admin@mhaveerfincap.com", 
            "tl@mhaveerfincap.com", 
            "hr@mhaveerfincap.com",
            "admin.mhaveer@mhaveerfincap.com",
            "tl.mhaveer@mhaveerfincap.com",
            "hr.mhaveer@mhaveerfincap.com"
          ] 
        } },
        { employeeId: {
          $in: [
            "EMP-SALES-01",
            "EMP-TL-01",
            "EMP-HR-01",
            "EMP-ADMIN-01"
          ]
        } }
      ]
    });




    for (const data of seedData) {
      const existingEmail = await Employee.findOne({ officialEmail: data.officialEmail });
      const existingId = await Employee.findOne({ employeeId: data.employeeId });
      
      if (!existingEmail && !existingId) {
        const hashedPassword = await bcrypt.hash(data.password, 10);
        const newUser = new Employee({
          ...data,
          password: hashedPassword
        });
        await newUser.save();
        console.log(`✅ Seeded ${data.role} account: ${data.officialEmail}`);
      } else {
        console.log(`ℹ️ Account already exists for ${data.role}: ${data.officialEmail}`);
      }
    }
  } catch (error) {
    console.error("❌ Error seeding database:", error);
  }
};

module.exports = seedUsers;

