const jwt = require("jsonwebtoken");

exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (email === "shahkevin1@gmail.com" && password === "123456") {
    const token = jwt.sign(
      { email, role: "SuperAdmin" },
      process.env.JWT_SECRET || "supersecretkey",
      { expiresIn: "1d" }
    );

    return res.json({
      success: true,
      token,
      message: "Login Success",
    });
  }

  console.log("Invalid Email or Password");
  return res.status(401).json({
    success: false,
    message: "Invalid Email or Password",
  });
};