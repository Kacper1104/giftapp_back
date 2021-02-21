"use strict";

const bcrypt = require("bcrypt");
const sql = require("../models/db.js");
const { auth, generateJWTToken, getUserIDFromJWT } = require("../config/JWT");
const user = require("./user.js");

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

	app.get("/auth", auth, async (req, res) => {
		const userId = getUserIDFromJWT(req);
		const query = "SELECT name, email FROM users WHERE id = ?;";
		const dbRecord = await sql.query(query, userId);
		if (dbRecord.length !== 1) {
			return res.status(404).send("User not found");
		}
		if (
			!dbRecord[0].name ||
			!dbRecord[0].email ||
			dbRecord[0].name === "" ||
			dbRecord[0].email === ""
		) {
			return res.status(400).send("User data incomplete");
		}
		return res
			.status(200)
			.send({ name: dbRecord[0].name, email: dbRecord[0].email });
	});
};
