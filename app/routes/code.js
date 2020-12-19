"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED, CODE_SEPARATOR } = require("../config/helper.js");
const crypto = require("crypto");

module.exports = (app) => {
    app.post("/codes", auth, async (req, res) => {
        try {
            const userId = getUserIDFromJWT(req);
            const { event_id, name } = req.body;
            if (!event_id || !name)
                return res.status(500).send("Incomplete request");
            //VALIDATE EVENT
            var query = 'SELECT id FROM events WHERE id = ? LIMIT 0, 1;'
            const event = await sql.query(query, [event_id]);
            if(event.length === 0)
                return res.status(BAD_REQUEST).send("Bad request");
            const code = event_id+CODE_SEPARATOR+crypto.randomBytes(3).toString('hex');
            //CHECK IF USER IS NOT GUEST
            query = "SELECT a.id FROM event_assignments a LEFT JOIN events e ON e.id = a.event_id LEFT JOIN users u ON u.id = a.user_id WHERE u.id = ? AND e.id = ?  AND a.role = 'Guest' LIMIT 0, 1;"
            const checkPrivilige = await sql.query(query, [userId, event_id]);
            if (checkPrivilige.length !== 0)
                return res.status(401).send(UNAUTHORIZED + ": User is not organiser of this event.")
            //GENERATE CODE ID
            query = "SELECT id FROM codes ORDER BY id DESC LIMIT 0, 1;";
            const latestIdCode = await sql.query(query);
            const newIdCode = latestIdCode.length !== 0 ? latestIdCode[0].id + 1 : 1;
            //INSERT CODE RECORD
            query = "INSERT INTO codes (id, code, invitee, event_id) VALUES (?, ?, ?, ?);";
            var params = [newIdCode, code, name, event_id];
            await sql.query(query, params);
            //END
            return res.status(CREATED).send("Created");
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });

    app.get("/codes", auth, async (req, res) => {
        try {
            const event_id = req.header("eventId");
            const userId = getUserIDFromJWT(req);
            if (!event_id)
                return res.status(500).send("Incomplete request - event id missing");
            //CHECK IF USER IS NOT GUEST
            query = "SELECT a.id FROM event_assignments a LEFT JOIN events e ON e.id = a.event_id LEFT JOIN users u ON u.id = a.user_id WHERE u.id = ? AND e.id = ?  AND a.role = 'Guest' LIMIT 0, 1;"
            const checkPrivilige = await sql.query(query, [userId, event_id]);
            if (checkPrivilige.length !== 0)
                return res.status(401).send(UNAUTHORIZED + ": User is not organiser of this event.")
            //RETRIVE CODES
            var query = "SELECT id, code, invitee FROM codes WHERE event_id = ?;";
            const lines = await sql.query(query, [event_id]);
            return res.status(200).json(lines);
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });
};