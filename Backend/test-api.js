const axios = require("axios");

async function test() {
  try {
    // 1. Try to login
    const loginRes = await axios.post("http://localhost:5000/api/auth/login", {
      email: "employee@mhaveerfincap.com", // need to know a valid employee email
      password: "password123"
    });
    console.log("Login res:", loginRes.data);
  } catch (err) {
    console.error("Login failed:", err.response ? err.response.data : err.message);
  }
}
test();