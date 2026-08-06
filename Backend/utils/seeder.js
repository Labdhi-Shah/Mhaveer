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
  }
];

const seedUsers = async () => {
  try {
    console.log("Checking DB for seed users...");
    
    // Clean up other seed users if they exist to completely remove them
    await Employee.deleteMany({ 
      officialEmail: { 
        $in: [
          "admin@mhaveerfincap.com", 
          "tl@mhaveerfincap.com", 
          "hr@mhaveerfincap.com"
        ] 
      } 
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
