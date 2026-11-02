const {
  submitEod,
  getMyEod,
  getMyEodById,
  updateMyEod,
  deleteMyEod,
  getTeamEod,
  getTeamEodByEmployee,
} = require("../controllers/eodController");
const Eod = require("../models/Eod");
const Employee = require("../models/Employee");

// Mock Mongoose models and WebSocket
jest.mock("../models/Eod");
jest.mock("../models/Employee");
jest.mock("../services/websocket", () => ({
  emitDataChange: jest.fn(),
}));

describe("EOD Controller Comprehensive Unit Tests", () => {
  let mockReq;
  let mockRes;
  const validRecordId = "507f1f77bcf86cd7994390aa";
  const validEmpId = "507f1f77bcf86cd799439011";

  beforeEach(() => {
    jest.clearAllMocks();
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };
  });

  describe("submitEod", () => {
    it("should return 401 if employee is not found in database", async () => {
      mockReq = {
        user: { id: "507f1f77bcf86cd799439000", role: "Employee" },
        body: { submissionDate: "2026-11-01", received: 10, appointment: 2, login: 1 },
      };
      Employee.findById.mockResolvedValue(null);
      Employee.findOne.mockResolvedValue(null);

      await submitEod(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(401);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({ success: false, message: expect.stringContaining("Employee not found") })
      );
    });

    it("should return 400 if submissionDate is missing or invalid", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        body: { submissionDate: "bad-date", received: 10, appointment: 2, login: 1 },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Test User",
        employeeId: "EMP001",
      });

      await submitEod(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("submissionDate"),
        })
      );
    });

    it("should return 400 if counts are negative or not integers", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        body: { submissionDate: "2026-11-01", received: -5, appointment: 2, login: 1 },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Test User",
        employeeId: "EMP001",
      });

      await submitEod(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(400);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("non-negative"),
        })
      );
    });

    it("should return 409 if EOD already exists for this date and allowUpdate is false", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        body: { submissionDate: "2026-11-01", received: 10, appointment: 2, login: 1, allowUpdate: false },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Test User",
        employeeId: "EMP001",
      });
      Eod.findOne.mockResolvedValue({
        _id: validRecordId,
        submissionDate: "2026-11-01",
      });

      await submitEod(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(409);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("already been submitted"),
        })
      );
    });

    it("should successfully update existing EOD if allowUpdate is true", async () => {
      const mockExisting = {
        _id: validRecordId,
        submissionDate: "2026-11-01",
        received: 5,
        appointment: 1,
        login: 0,
        save: jest.fn().mockResolvedValue(true),
      };
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        body: { submissionDate: "2026-11-01", received: 15, appointment: 3, login: 2, allowUpdate: true },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Test User",
        employeeId: "EMP001",
      });
      Eod.findOne.mockResolvedValue(mockExisting);

      await submitEod(mockReq, mockRes);
      expect(mockExisting.received).toBe(15);
      expect(mockExisting.appointment).toBe(3);
      expect(mockExisting.login).toBe(2);
      expect(mockExisting.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: expect.stringContaining("updated successfully"),
        })
      );
    });

    it("should successfully save a new EOD and return 201", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        body: { submissionDate: "2026-11-01", received: 15, appointment: 3, login: 2 },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Test User",
        employeeId: "EMP001",
        officialEmail: "test@nobalfinance.com",
      });
      Eod.findOne.mockResolvedValue(null);

      const mockSaved = {
        _id: validRecordId,
        employeeId: validEmpId,
        employeeName: "Test User",
        submissionDate: "2026-11-01",
        received: 15,
        appointment: 3,
        login: 2,
      };
      Eod.mockImplementation(() => ({
        ...mockSaved,
        save: jest.fn().mockResolvedValue(mockSaved),
      }));

      await submitEod(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "EOD report submitted successfully.",
        })
      );
    });
  });

  describe("getMyEod (Privacy Scope)", () => {
    it("should strictly query EOD records belonging to the authenticated employee", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        query: { date: "2026-11-01" },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Employee A",
      });

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: "rec1", employeeName: "Employee A", submissionDate: "2026-11-01", received: 15 },
        ]),
      };
      Eod.find.mockReturnValue(mockQuery);
      Eod.countDocuments.mockResolvedValue(1);

      await getMyEod(mockReq, mockRes);
      expect(Eod.find).toHaveBeenCalledWith(
        expect.objectContaining({
          employeeId: validEmpId,
          submissionDate: "2026-11-01",
        })
      );
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
        })
      );
    });
  });

  describe("getMyEodById", () => {
    it("should return 404 if record does not belong to the employee", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        params: { id: validRecordId },
      };
      Employee.findById.mockResolvedValue({
        _id: validEmpId,
        name: "Employee A",
      });
      Eod.findOne.mockResolvedValue(null);

      await getMyEodById(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(404);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("access denied"),
        })
      );
    });
  });

  describe("updateMyEod & deleteMyEod", () => {
    it("should update employee's own EOD record", async () => {
      const mockRecord = {
        _id: validRecordId,
        employeeId: validEmpId,
        received: 10,
        appointment: 2,
        login: 1,
        submissionDate: "2026-11-01",
        save: jest.fn().mockResolvedValue(true),
      };
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        params: { id: validRecordId },
        body: { received: 25, appointment: 5, login: 3 },
      };
      Employee.findById.mockResolvedValue({ _id: validEmpId });
      Eod.findOne.mockResolvedValue(mockRecord);

      await updateMyEod(mockReq, mockRes);
      expect(mockRecord.received).toBe(25);
      expect(mockRecord.appointment).toBe(5);
      expect(mockRecord.login).toBe(3);
      expect(mockRecord.save).toHaveBeenCalled();
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "EOD record updated successfully.",
        })
      );
    });

    it("should delete employee's own EOD record", async () => {
      mockReq = {
        user: { id: validEmpId, role: "Employee" },
        params: { id: validRecordId },
      };
      Employee.findById.mockResolvedValue({ _id: validEmpId });
      Eod.findOneAndDelete.mockResolvedValue({ _id: validRecordId });

      await deleteMyEod(mockReq, mockRes);
      expect(Eod.findOneAndDelete).toHaveBeenCalledWith({
        _id: validRecordId,
        employeeId: validEmpId,
      });
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          message: "EOD record deleted successfully.",
        })
      );
    });
  });

  describe("getTeamEod (Manager Access)", () => {
    it("should query only assigned team member records", async () => {
      mockReq = {
        user: { id: "507f1f77bcf86cd799439001", role: "Manager", department: "Telecalling" },
        query: { date: "2026-11-01" },
      };
      Employee.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439001",
        employeeId: "MGR001",
        name: "Manager Alpha",
        role: "Manager",
      });
      Employee.find.mockResolvedValue([
        { _id: "507f1f77bcf86cd799439011" },
        { _id: "507f1f77bcf86cd799439012" },
      ]);

      const mockQuery = {
        sort: jest.fn().mockReturnThis(),
        skip: jest.fn().mockReturnThis(),
        limit: jest.fn().mockResolvedValue([
          { _id: "rec1", employeeName: "Team Member 1", submissionDate: "2026-11-01" },
        ]),
      };
      Eod.find.mockReturnValue(mockQuery);
      Eod.countDocuments.mockResolvedValue(1);

      await getTeamEod(mockReq, mockRes);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: true,
          count: 1,
        })
      );
    });
  });

  describe("getTeamEodByEmployee (Manager Authorization)", () => {
    it("should return 403 if target employee is outside manager assigned team", async () => {
      mockReq = {
        user: { id: "507f1f77bcf86cd799439001", role: "Manager", department: "Telecalling" },
        params: { employeeId: "507f1f77bcf86cd799439002" },
        query: {},
      };
      Employee.findById.mockResolvedValue({
        _id: "507f1f77bcf86cd799439001",
        name: "Manager Alpha",
        role: "Manager",
      });
      Employee.findOne.mockResolvedValue({
        _id: "507f1f77bcf86cd799439002",
        name: "Employee Other",
        employeeId: "EMP-OTHER",
      });
      Employee.find.mockResolvedValue([
        { _id: "507f1f77bcf86cd799439003" },
      ]);

      await getTeamEodByEmployee(mockReq, mockRes);
      expect(mockRes.status).toHaveBeenCalledWith(403);
      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          success: false,
          message: expect.stringContaining("outside your assigned team"),
        })
      );
    });
  });
});
