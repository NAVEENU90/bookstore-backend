const jwt = require("jsonwebtoken");

const jwtMiddleware = (req, res, next) => {
  const authorization = req.headers.authorization;
  const token =
    typeof authorization === "string"
      ? authorization.match(/^Bearer\s+(\S+)$/i)?.[1]
      : undefined;

  if (!token) {
    return res.status(401).json("Invalid Token");
  }

  try {
    const jwtResponse = jwt.verify(token, "secretKey");
    console.log(jwtResponse);
    req.payload = jwtResponse.userMail;
  } catch (err) {
    return res.status(401).json("Invalid Token");
  }

  return next();
};
module.exports = jwtMiddleware;
