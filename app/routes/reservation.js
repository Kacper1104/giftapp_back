"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED } = require("../config/helper.js");
const ROLE = { ORGANISER: "Organiser", GUEST: "Guest" };

module.exports = (app) => {
    app.post("/reservations", auth, async (req, res) => {
        try {
            const userId = getUserIDFromJWT(req);
            const { gift_id, max_users } = req.body;
            if (!gift_id || !max_users)
                return res.status(500).send("Incomplete request");

            //CHECK IF USER ALREADY HAS RESERVATIONS
            query = "SELECT r.id FROM reservations r LEFT JOIN gifts g ON r.gift_id = g.id LEFT JOIN events e ON e.id = g.event_id LEFT JOIN event_assignments a ON a.event_id = e.id WHERE a.reservation_id = r.id AND a.user_id = ?;"
            const checkReservations = await sql.query(query, [userId]);
            if (checkReservations.length !== 0)
                return res.status(409).send(CONFLICT + ": User has already made a reservation");

            //CHECK IF USER IS ORGANISER OF GIFT'S EVENT
            query = "SELECT g.id FROM gifts g LEFT JOIN events e ON e.id = g.event_id LEFT JOIN event_assignments a ON a.event_id = e.id WHERE a.role = 'Guest' AND g.id = ? AND a.user_id = ?;"
            const checkRole = await sql.query(query, [userId]);
            if (checkRole.length === 0)
                return res.status(401).send(UNAUTHORIZED + ": User is not a guest of the event.");

            //CHECK FOR LATEST RESERVATION ID
            var query = "SELECT id FROM reservations ORDER BY id DESC LIMIT 0, 1;";
            const latestIdRes = await sql.query(query);
            const newIdRes = latestIdRes.length !== 0 ? latestIdRes[0].id + 1 : 1;

            //INSERT GIFT RECORD
            query =
                "INSERT INTO gifts (id, event_id, name, desctription) VALUES (?, ?, ?, ?);";
            var params = [newIdRes, event_id, name, description];
            await sql.query(query, params);
            //END
            return res.status(CREATED).send("Created");
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });

    // app.get("/gifts/:eventId", auth, async (req, res) => {
    //     try {
    //         const eventId = req.params.eventId;
    //         const userId = getUserIDFromJWT(req);
    //         if (!eventId)
    //             return res.status(500).send("Incomplete request - event id missing");
    //         //retrive event elements
    //         var query = "SELECT g.id AS gift_id, g.name AS gift_name, g.description AS gift_description, g.changed_date AS gift_changed_date, r.max_users AS res_max_contributors, r.changed_date AS res_changed_date, IF(r.id IS NOT NULL, true, false) AS is_reserved, IF(a.user_id = ?, true, false) AS is_user_res FROM gifts g LEFT JOIN reservations r ON r.gift_id = g.id LEFT JOIN event_assignments a ON a.reservation_id = r.id WHERE g.event_id = ?;";
    //         const lines = await sql.query(query, [userId, eventId]);
    //         return res.status(200).json(lines);
    //     }
    //     catch (error) {
    //         console.log(error);
    //         res.status(BAD_REQUEST).send("Bad request");
    //     }
    // });
};