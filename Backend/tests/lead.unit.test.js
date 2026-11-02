const leadController = require("../controllers/leadController");
const Lead = require("../models/Lead");
const Meeting = require("../models/Meeting");
const Employee = require("../models/Employee");
const websocket = require("../services/websocket");

jest.mock("../models/Lead");
jest.mock("../models/Meeting");
jest.mock("../models/Employee");
jest.mock("../services/salesAssignmentService", () => ({
  assignMeetingToSalesEmployee: jest.fn().mockResolvedValue(true),
}));
jest.mock("../services/websocket", () => ({
  getIO: jest.fn(),
  emitDataChange: jest.fn(),
}));
jest.mock("../utils/notificationHelper", () => ({
  createNotification: jest.fn().mockResolvedValue(true),
}));

describe("Lead Controller - Remarks & Authorization Unit Tests", () => {
  let req;
  let res;

  beforeEach(() => {
    jest.clearAllMocks();
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  describe("updateLead remarks handling", () => {
    test("should update remarks and preserve existing lead fields", async () => {
      req = {
        params: { id: "64e000000000000000000001" },
        user: { id: "emp_123", role: "Employee", employeeId: "EMP001", email: "test@mhaveer.com" },
        body: {
          remarks: "Client requested follow-up after salary credited on 5th.",
          contactPerson: "Rajesh Kumar",
        },
      };

      const existingLead = {
        _id: "64e000000000000000000001",
        companyName: "ABC Corp",
        contactPerson: "Rajesh",
        employeeId: "emp_123",
        remarks: "Old remarks",
      };

      Lead.findById.mockResolvedValue(existingLead);
      Meeting.findOne.mockResolvedValue(null);

      const updatedLead = {
        ...existingLead,
        contactPerson: "Rajesh Kumar",
        remarks: "Client requested follow-up after salary credited on 5th.",
      };
      Lead.findByIdAndUpdate.mockResolvedValue(updatedLead);

      await leadController.updateLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "Lead updated successfully",
          data: expect.objectContaining({
            remarks: "Client requested follow-up after salary credited on 5th.",
          }),
        })
      );

      expect(Lead.findByIdAndUpdate).toHaveBeenCalledWith(
        "64e000000000000000000001",
        {
          $set: expect.objectContaining({
            remarks: "Client requested follow-up after salary credited on 5th.",
            contactPerson: "Rajesh Kumar",
          }),
        },
        { new: true, runValidators: true }
      );
      expect(websocket.emitDataChange).toHaveBeenCalledWith(
        expect.objectContaining({
          entity: "lead",
          action: "update",
        })
      );
    });

    test("should allow updating remarks by employee matching employeeCode", async () => {
      req = {
        params: { id: "64e000000000000000000002" },
        user: { id: "random_id", role: "Employee", employeeId: "EMP099", email: "other@mhaveer.com" },
        body: {
          remarks: "Updated by assigned employeeCode",
        },
      };

      const existingLead = {
        _id: "64e000000000000000000002",
        employeeCode: "EMP099",
        remarks: "Previous note",
      };

      Lead.findById.mockResolvedValue(existingLead);
      Meeting.findOne.mockResolvedValue(null);
      Lead.findByIdAndUpdate.mockResolvedValue({
        ...existingLead,
        remarks: "Updated by assigned employeeCode",
      });

      await leadController.updateLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            remarks: "Updated by assigned employeeCode",
          }),
        })
      );
    });

    test("should reject update with 403 if user is not authorized for this lead", async () => {
      req = {
        params: { id: "64e000000000000000000003" },
        user: { id: "unauthorized_emp", role: "Employee", employeeId: "EMP999", email: "unauth@mhaveer.com" },
        body: { remarks: "Malicious update" },
      };

      const existingLead = {
        _id: "64e000000000000000000003",
        employeeId: "legit_emp",
        employeeCode: "EMP100",
        remarks: "Secret note",
      };

      Lead.findById.mockResolvedValue(existingLead);

      await leadController.updateLead(req, res);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: "Not authorized to update this lead",
        })
      );
      expect(Lead.findByIdAndUpdate).not.toHaveBeenCalled();
    });

    test("should allow Manager to update remarks for any team lead", async () => {
      req = {
        params: { id: "64e000000000000000000004" },
        user: { id: "mgr_1", role: "Manager", employeeId: "MGR001", email: "mgr@mhaveer.com" },
        body: { remarks: "Manager review notes added" },
      };

      const existingLead = {
        _id: "64e000000000000000000004",
        employeeId: "emp_10",
        remarks: "Initial employee note",
      };

      Lead.findById.mockResolvedValue(existingLead);
      Meeting.findOne.mockResolvedValue(null);
      Lead.findByIdAndUpdate.mockResolvedValue({
        ...existingLead,
        remarks: "Manager review notes added",
      });

      await leadController.updateLead(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            remarks: "Manager review notes added",
          }),
        })
      );
    });
  });
});

