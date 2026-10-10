const request = require("supertest");
const app = require("../server");
const mongoose = require("mongoose");

describe("App Basics", () => {
  it("should return successful response on the test route", async () => {
    const res = await request(app).get("/");
    expect(res.statusCode).toEqual(200);
    expect(res.text).toContain("Backend is Running Successfully...");
  });
});

afterAll(async () => {
  // Ensure db connection is closed after tests complete so jest can exit cleanly
  await mongoose.connection.close();
});
