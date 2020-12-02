"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED } = require("../config/helper.js");
const ROLE = { ORGANISER: "Organiser", GUEST: "Guest" };

module.exports = (app) => {
    app.post("/gifts", auth, async (req, res) => {
        try {
            const userId = getUserIDFromJWT(req);
            const { event_id, name, description } = req.body;
            if (!event_id || !name || !description)
                return res.status(500).send("Incomplete request");
            //CHECK FOR LATEST GIFT ID
            var query = "SELECT id FROM gifts ORDER BY id DESC LIMIT 0, 1;";
            const latestIdGift = await sql.query(query);
            const newIdGift = latestIdGift.length !== 0 ? latestIdGift[0].id + 1 : 1;

            //CHECK IF USER IS GUEST
            query = "SELECT a.id FROM event_assignments a LEFT JOIN events e ON e.id = a.event_id LEFT JOIN users u ON u.id = a.user_id WHERE u.id = ? AND e.id = ?  AND a.role = 'Guest' LIMIT 0, 1;"
            const checkPrivilige = await sql.query(query, [userId, event_id]);
            if (checkPrivilige.length !== 0)
                return res.status(401).send(UNAUTHORIZED + ": User is not organiser of this event.")
            //INSERT GIFT RECORD
            query = "INSERT INTO gifts (id, event_id, name, description) VALUES (?, ?, ?, ?);";
            var params = [newIdGift, event_id, name, description];
            await sql.query(query, params);
            //END
            return res.status(CREATED).send("Created");
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });


    app.get("/gifts", auth, async (req, res) => {
        try {
            //console.log("REQ COUGHT!");
            const eventId = req.header("eventId");
            //console.log(eventId);
            const userId = getUserIDFromJWT(req);
            if (!eventId)
                return res.status(500).send("Incomplete request - event id missing");
            //retrive event elements
            var query = "SELECT g.id AS gift_id, g.name AS gift_name, g.description AS gift_description, g.changed_date AS gift_changed_date, MIN(r.max_users) AS res_max_contributors, MAX(r.changed_date) AS res_changed_date, IF(COUNT(r.id) > 0, true, false) AS is_reserved, SUM(IF(a.user_id = ?, 1, 0)) AS is_user_res, COUNT(r.id) AS res_count FROM gifts g LEFT JOIN reservations r ON r.gift_id = g.id LEFT JOIN event_assignments a ON r.assignment_id = a.id WHERE g.event_id = ? GROUP BY g.id;";
            const lines = await sql.query(query, [userId, eventId]);
            return res.status(200).json(lines);
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });
};