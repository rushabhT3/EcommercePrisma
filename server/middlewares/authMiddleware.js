// authMiddleware.js
const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  const token = req.headers.authorization;

  if (token) {
    jwt.verify(token, "jwt_secret_key", (err, user) => {
      if (err) {
        console.log(err);
        if (err.name === "TokenExpiredError") {
          return res.status(403).send({
            message: "Your session has expired. Please log in again.",
          });
        } else {
          return res.sendStatus(403);
        }
      }
      req.user = user;
      next();
    });
  } else {
    res.sendStatus(401);
  }
};

module.exports = authenticateJWT;
