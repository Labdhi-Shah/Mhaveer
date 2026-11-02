const request = require("supertest");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const app = require("../server");
const Eod = require("../models/Eod");
const Employee = require("../models/Employee");

const JWT_SECRET = process.env.JWT_SECRET || "mahaveer123456";

describe("EOD System APIs", () => {
  let employeeA;
  let employeeB;
  let managerA;
  let managerB;
  let tokenA;
  let tokenB;
  let tokenManagerA;
  let tokenManagerB;

  beforeAll(async () => {
    // If db connection is not ready, wait
    if (mongoose.connection.readyState !== 1) {
      await new Promise((resolve) => mongoose.connection.once("open", resolve));
    }

    // Clean up test data
    await Employee.deleteMany({ officialEmail: /test_eod_.*@mhaveer.com/ });
    await Eod.deleteMany({ officialEmail: /test_eod_.*@mhaveer.com/ });

    // 1. Create Manager A
    managerA = await Employee.create({
      employeeId: `TEST-MGR-A-${Date.now()}`,
      name: "Manager Alpha",
      personalEmail: `test_eod_mgra_${Date.now()}@mhaveer.com`,
      officialEmail: `test_eod_mgra_${Date.now()}@mhaveer.com`,
      phone: "9876543210",
      role: "Manager",
      department: "Telecalling",
      password: "hashedpassword123",
    });

    // 2. Create Manager B (Different team manager)
    managerB = await Employee.create({
      employeeId: `TEST-MGR-B-${Date.now()}`,
      name: "Manager Beta",
      personalEmail: `test_eod_mgrb_${Date.now()}@mhaveer.com`,
      officialEmail: `test_eod_mgrb_${Date.now()}@mhaveer.com`,
      phone: "9876543211",
      role: "Manager",
      department: "Sales",
      password: "hashedpassword123",
    });

    // 3. Create Employee A (Assigned to Manager A)
    employeeA = await Employee.create({
      employeeId: `TEST-EMP-A-${Date.now()}`,
      name: "Employee Alpha",
      personalEmail: `test_eod_empa_${Date.now()}@mhaveer.com`,
      officialEmail: `test_eod_empa_${Date.now()}@mhaveer.com`,
      phone: "9876543212",
      role: "Employee",
      department: "Telecalling",
      managerId: String(managerA._id),
      managerName: managerA.name,
      reportingTo: String(managerA._id),
      password: "hashedpassword123",
    });

    // 4. Create Employee B (Assigned to Manager B)
    employeeB = await Employee.create({
      employeeId: `TEST-EMP-B-${Date.now()}`,
      name: "Employee Beta",
      personalEmail: `test_eod_empb_${Date.now()}@mhaveer.com`,
      officialEmail: `test_eod_empb_${Date.now()}@mhaveer.com`,
      phone: "9876543213",
      role: "Employee",
      department: "Sales",
      managerId: String(managerB._id),
      managerName: managerB.name,
      reportingTo: String(managerB._id),
      password: "hashedpassword123",
    });

    // Generate JWT tokens
    tokenA = jwt.sign(
      {
        id: employeeA._id,
        email: employeeA.officialEmail,
        role: "Employee",
        department: "Telecalling",
        name: employeeA.name,
        employeeId: employeeA.employeeId,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    tokenB = jwt.sign(
      {
        id: employeeB._id,
        email: employeeB.officialEmail,
        role: "Employee",
        department: "Sales",
        name: employeeB.name,
        employeeId: employeeB.employeeId,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    tokenManagerA = jwt.sign(
      {
        id: managerA._id,
        email: managerA.officialEmail,
        role: "Manager",
        department: "Telecalling",
        name: managerA.name,
        employeeId: managerA.employeeId,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );

    tokenManagerB = jwt.sign(
      {
        id: managerB._id,
        email: managerB.officialEmail,
        role: "Manager",
        department: "Sales",
        name: managerB.name,
        employeeId: managerB.employeeId,
      },
      JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    // Clean up test data
    if (mongoose.connection.readyState === 1) {
      await Employee.deleteMany({ officialEmail: /test_eod_.*@mhaveer.com/ });
      await Eod.deleteMany({ officialEmail: /test_eod_.*@mhaveer.com/ });
      await mongoose.connection.close();
    }
  });

  describe("Security & Authentication", () => {
    it("should reject requests without token with 401", async () => {
      const res = await request(app).get("/api/eod/my");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should reject requests with invalid token with 401", async () => {
      const res = await request(app)
        .get("/api/eod/my")
        .set("Authorization", "Bearer invalidtoken123");
      expect(res.statusCode).toBe(401);
      expect(res.body.success).toBe(false);
    });

    it("should prevent normal employees from accessing Manager team EOD route with 403", async () => {
      const res = await request(app)
        .get("/api/eod/team")
        .set("Authorization", `Bearer ${tokenA}`);
      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
    });
  });

  describe("Employee EOD Submissions & Data Validation", () => {
    it("should reject submission with missing or invalid date with 400", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "invalid-date",
          received: 10,
          appointment: 2,
          login: 1,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject submission with negative numbers with 400", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "2026-11-01",
          received: -5,
          appointment: 2,
          login: 1,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it("should reject submission with decimal numbers with 400", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "2026-11-01",
          received: 5.5,
          appointment: 2,
          login: 1,
        });
      expect(res.statusCode).toBe(400);
      expect(res.body.success).toBe(false);
    });

    let eodAId;

    it("should allow Employee A to submit a valid EOD with selected date", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "2026-11-01",
          received: 15,
          appointment: 3,
          login: 2,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.employeeId).toBe(String(employeeA._id));
      expect(res.body.data.submissionDate).toBe("2026-11-01");
      expect(res.body.data.received).toBe(15);
      expect(res.body.data.appointment).toBe(3);
      expect(res.body.data.login).toBe(2);
      eodAId = res.body.data._id;
    });

    it("should prevent duplicate submission on the same date for the same employee with 409", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "2026-11-01",
          received: 20,
          appointment: 4,
          login: 3,
        });
      expect(res.statusCode).toBe(409);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("already been submitted");
    });

    it("should allow Employee A to submit an EOD for a different/custom date", async () => {
      const res = await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenA}`)
        .send({
          submissionDate: "2026-10-25",
          received: 8,
          appointment: 1,
          login: 1,
        });
      expect(res.statusCode).toBe(201);
      expect(res.body.data.submissionDate).toBe("2026-10-25");
    });
  });

  describe("Employee Privacy Isolation", () => {
    it("should only return Employee A's submissions to Employee A", async () => {
      // First, Employee B submits an EOD
      await request(app)
        .post("/api/eod")
        .set("Authorization", `Bearer ${tokenB}`)
        .send({
          submissionDate: "2026-11-01",
          received: 42,
          appointment: 7,
          login: 5,
        });

      // Employee A fetches their records
      const resA = await request(app)
        .get("/api/eod/my")
        .set("Authorization", `Bearer ${tokenA}`);

      expect(resA.statusCode).toBe(200);
      expect(resA.body.success).toBe(true);
      // All returned records must belong ONLY to Employee A
      resA.body.data.forEach((item) => {
        expect(String(item.employeeId)).toBe(String(employeeA._id));
        expect(item.employeeName).toBe(employeeA.name);
      });
      // Ensure Employee B's submission of 42 is NOT in Employee A's results
      const bFound = resA.body.data.some((item) => item.received === 42);
      expect(bFound).toBe(false);
    });

    it("should prevent Employee B from viewing Employee A's EOD by ID", async () => {
      const allA = await Eod.find({ employeeId: employeeA._id });
      expect(allA.length).toBeGreaterThan(0);
      const aId = allA[0]._id;

      // Employee B tries to fetch Employee A's record directly
      const resB = await request(app)
        .get(`/api/eod/my/${aId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(resB.statusCode).toBe(404);
      expect(resB.body.success).toBe(false);
    });

    it("should prevent Employee B from updating or deleting Employee A's EOD", async () => {
      const allA = await Eod.find({ employeeId: employeeA._id });
      const aId = allA[0]._id;

      // Employee B tries to update Employee A's record
      const updateRes = await request(app)
        .put(`/api/eod/my/${aId}`)
        .set("Authorization", `Bearer ${tokenB}`)
        .send({ received: 999 });

      expect(updateRes.statusCode).toBe(404);

      // Employee B tries to delete Employee A's record
      const deleteRes = await request(app)
        .delete(`/api/eod/my/${aId}`)
        .set("Authorization", `Bearer ${tokenB}`);

      expect(deleteRes.statusCode).toBe(404);
    });
  });

  describe("Manager Team Hierarchy & Access Control", () => {
    it("should allow Manager A to view assigned team member submissions", async () => {
      const res = await request(app)
        .get("/api/eod/team")
        .set("Authorization", `Bearer ${tokenManagerA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      // Manager A should see Employee A's submission
      const hasEmpA = res.body.data.some((r) => String(r.employeeId) === String(employeeA._id));
      expect(hasEmpA).toBe(true);
      // Manager A should NOT see Employee B's submission (assigned to Manager B)
      const hasEmpB = res.body.data.some((r) => String(r.employeeId) === String(employeeB._id));
      expect(hasEmpB).toBe(false);
    });

    it("should support date-wise filtering on Manager team endpoint", async () => {
      const res = await request(app)
        .get("/api/eod/team?date=2026-11-01")
        .set("Authorization", `Bearer ${tokenManagerA}`);

      expect(res.statusCode).toBe(200);
      res.body.data.forEach((r) => {
        expect(r.submissionDate).toBe("2026-11-01");
      });
    });

    it("should prevent Manager A from accessing an employee outside their team via /team/:employeeId", async () => {
      const res = await request(app)
        .get(`/api/eod/team/${employeeB._id}`)
        .set("Authorization", `Bearer ${tokenManagerA}`);

      expect(res.statusCode).toBe(403);
      expect(res.body.success).toBe(false);
      expect(res.body.message).toContain("outside your assigned team");
    });

    it("should allow Manager A to access their own assigned team member via /team/:employeeId", async () => {
      const res = await request(app)
        .get(`/api/eod/team/${employeeA._id}`)
        .set("Authorization", `Bearer ${tokenManagerA}`);

      expect(res.statusCode).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.employee.id).toBe(String(employeeA._id));
      expect(res.body.data.length).toBeGreaterThan(0);
    });
  });
});

