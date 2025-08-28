import { verifyToken } from "../utils/jsonWebToken.js";

const authMiddleware = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    let authToken;

    if (authHeader && authHeader.startsWith("Bearer ")) {
      authToken = authHeader.split(" ")[1];
    } else if (req.headers.cookie) {
      const cookieToken = req.headers.cookie
        .split(";")
        .find((c) => c.trim().startsWith("token="));

      if (cookieToken) {
        authToken = cookieToken.split("=")[1];
      }
    }

    if (!authToken) {
      return res.status(401).json({ message: "Unauthorized access" });
    }

    const decoded = await verifyToken(authToken);

    req.user = decoded;

    next();
  } catch (error) {
    return res.status(401).json({ message: "Unauthorized access" });
  }
};

export default authMiddleware;
