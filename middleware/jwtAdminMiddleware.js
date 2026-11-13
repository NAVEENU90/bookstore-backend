const jwt = require("jsonwebtoken");

const jwtAdminMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token =
    typeof authorization === "string"
      ? authorization
          .trim()
          .replace(/^(?:Bearer\s+)+/i, "")
          .replace(/^["']|["']$/g, "")
          .trim()
      : "";

  if (!token) {
    return res.status(401).json("Missing Bearer token");
  }

  try {
    const jwtResponse = jwt.verify(token, "secretKey");
    req.payload = jwtResponse.userMail;

    const userMail =
      typeof jwtResponse.userMail === "string"
        ? jwtResponse.userMail.trim().toLowerCase()
        : "";

    if (userMail !== "bookadmin@gmail.com") {
      return res.status(403).json("Admin access required");
    }

    return next();
  } catch (err) {
    console.error("Admin JWT verification failed:", err.name);
    return res.status(401).json("Invalid or expired Token");
  }
};
module.exports = jwtAdminMiddleware;
