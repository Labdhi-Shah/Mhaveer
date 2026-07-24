const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        message: "Email and password are required",
      });
    }

    if (
      email === process.env.ADMIN_EMAIL &&
      password === process.env.ADMIN_PASSWORD
    ) {
      return res.status(200).json({
        success: true,
        message: "Admin login successful",
        user: {
          email: email,
          role: "admin",
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid email or password",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

module.exports = { login };