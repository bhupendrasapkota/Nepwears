const roleBasedAuth = (allowedRoles) => {
  return (req, res, next) => {
    const userRoles = req.user.roles;

    if (!userRoles || !Array.isArray(userRoles)) {
      return res.status(401).json({ message: "User roles not found" });
    }

    const hasAccess = userRoles.some((role) => allowedRoles.includes(role));

    if (!hasAccess) {
      return res
        .status(403)
        .json({ message: `${req.user.firstName}, you don't have access.` });
    }

    next();
  };
};

export default roleBasedAuth;
