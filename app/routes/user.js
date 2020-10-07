"use strict";

const bcrypt = require("bcrypt");
const sql = require("../models/db.js");
const { generateJWTToken } = require("../config/JWT");
const saltRounds = 10;

module.exports = (app) => {
  app.post("/users", async (req, res) => {
    const { role_id, email, name, password } = req.body;
    if (!role_id || !email || !name || !password)
      return res.status(500).send("Incomplete request");
    //CHECK FOR DUPLICATES
    var query = "SELECT * FROM users WHERE email = ? LIMIT 0, 1;";
    const duplicate = await sql.query(query, email);
    if (duplicate.length !== 0) return res.status(409).send("Conflict");
    //CHECK FOR LATEST ID
    query = "SELECT * FROM users ORDER BY id DESC LIMIT 0, 1;";
    const latestIdUser = await sql.query(query);
    const latestId = latestIdUser.length !== 0 ? latestIdUser[0].id + 1 : 1;
    //GENERATE PASSWORD HASH
    const hash = bcrypt.hashSync(password, saltRounds);
    //INSERT RECORD
    query =
      "INSERT INTO users (id, role_id, email, name, password, account_confirmed) VALUES (?, ?, ?, ?, ?, ?)";
    var params = [latestId, role_id, email, name, hash, true];
    sql.query(query, params);
    const _user = { id: latestId, isAdmin: false, email: email };
    return res.status(201).json(generateJWTToken(_user));
  });
};
