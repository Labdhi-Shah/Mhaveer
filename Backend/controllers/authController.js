exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (
    email === "admin@example.com" &&
    password === "123456"
  ) {
    return res.json({
      success: true,
      token: "jwt-token",
      message: "Login Success",
    });
  }


  console.log("Invalid Email or Password");
  return res.status(401).json({
    success: false,
    message: "Invalid Email or Password",
  });
};