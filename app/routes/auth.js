"use strict";

const bcrypt = require("bcrypt");
const sql = require("../models/db.js");
const { generateJWTToken } = require("../config/JWT");

module.exports = (app) => {
  app.post("/auth", async (req, res) => {
    const { email, password } = req.body;
    const query = "SELECT * FROM users WHERE email = ? LIMIT 0, 1;";
    const user = await sql.query(query, email);
    if (user.length === 0) return res.status(404).send("User not found");
    if (!(await bcrypt.compare(password, user[0].password)))
      return res.status(401).send("Unauthorized");
    return res.status(200).json(generateJWTToken(user[0]));
  });
};
