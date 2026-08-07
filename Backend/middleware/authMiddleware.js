const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({ success: false, message: "No token, authorization denied" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "supersecretkey");
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Token is not valid" });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: "Unauthorized: No user credentials" });
    }
    const userRole = req.user.role ? req.user.role.toLowerCase() : "";
    const isAuthorized = roles.some(role => {
      const targetRole = role.toLowerCase();
      if (userRole === targetRole) return true;
      if (targetRole === 'admin' && (userRole === 'administration (admin)' || userRole === 'superadmin' || userRole === 'admin')) return true;
      if (targetRole === 'hr' && (userRole === 'human resources (hr)' || userRole === 'hr')) return true;
      if (targetRole === 'sales' && (userRole === 'sales department' || userRole === 'sales')) return true;
      if (targetRole === 'team leader' && (userRole === 'team leader' || userRole === 'tl' || userRole === 'teamleader')) return true;
      return userRole.includes(targetRole) || targetRole.includes(userRole);
    });

    if (!isAuthorized) {
      return res.status(403).json({ success: false, message: "Access Denied: You do not have permission to access this resource" });
    }
    next();
  };
};

module.exports = authMiddleware;
authMiddleware.authorize = authorize;

