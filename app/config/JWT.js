const path = require("path");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const requiresAuth = true;
//private and public key
const privateKEY = process.env.JWT_PRIVATE_KEY || fs.readFileSync(
  path.join(__dirname, "../config/private.key"),
  "utf8"
);
const publicKEY = process.env.JWT_PUBLIC_KEY || fs.readFileSync(
  path.join(__dirname, "../config/public.key"),
  "utf8"
);

const generateJWTToken = (user) => {
  //payload
  var payload = {
    id: user.id,
    isAdmin: user.isAdmin,
    name: user.email
  };
  //sign options
  const signOptions = {
    issuer: "Kacpi",
    subject: "JTW Session token",
    audience: user.email,
    expiresIn: "12h",
    algorithm: "RS256"
  };
  return jwt.sign(payload, privateKEY, signOptions);
};

function getUserIDFromJWT(req) {
  const token = req.header(`x-auth-token`);
  return jwt.decode(token).id;
}

function auth(req, res, next) {
  if (requiresAuth) {
    const token = req.header(`x-auth-token`);
    if (!token) { 
      return res.status(401).send(`Access denied. No token provided`);
    }

    try {
      const decoded = jwt.verify(token, privateKEY, { algorithms: ["RS256"] });
      req.user = decoded;

      next();
    } catch (ex) {
      return res.status(401).send(`Invalid token`);
    }
  } else return;
}

exports.generateJWTToken = generateJWTToken;
exports.auth = auth;
exports.getUserIDFromJWT = getUserIDFromJWT;
