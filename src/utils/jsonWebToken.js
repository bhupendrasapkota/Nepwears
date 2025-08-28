import jwt from "jsonwebtoken";
import config from "../config/config.js";

export const generateToken = (data) => {
  const token = jwt.sign(data, config.jwtSecret, {
    expiresIn: config.jwtExpiration,
  });

  return token;
};

export const verifyToken = (token) => {
  try {
    return new Promise((resolve, reject) => {
      jwt.verify(token, config.jwtSecret, (err, decoded) => {
        if (err) {
          return reject(err);
        }
        resolve(decoded);
      });
    });
  } catch (error) {
    throw new Error("Token verification failed");
  }
};
