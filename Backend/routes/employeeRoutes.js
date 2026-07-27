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

router.route("/").post(createEmployee).get(getEmployees);
router.route("/:id").get(getEmployeeById).put(updateEmployee).delete(deleteEmployee);

module.exports = router;
