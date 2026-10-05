const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  createEmployee,
  getEmployees,
  getEmployeeById,
  updateEmployee,
  deleteEmployee,
} = require("../controllers/employeeController");

router.use(authMiddleware);

router.route("/")
  .post(authMiddleware.authorize("Manager", "Administration (Admin)", "Admin", "SuperAdmin", "Human Resources (HR)", "HR"), createEmployee)
  .get(getEmployees);

router.route("/:id")
  .get(getEmployeeById)
  .put(authMiddleware.authorize("Manager", "Administration (Admin)", "Admin", "SuperAdmin", "Human Resources (HR)", "HR"), updateEmployee)
  .delete(authMiddleware.authorize("Manager", "Administration (Admin)", "Admin", "SuperAdmin"), deleteEmployee);

module.exports = router;
