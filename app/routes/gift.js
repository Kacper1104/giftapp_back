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
            query =
                "INSERT INTO gifts (id, event_id, name, desctription) VALUES (?, ?, ?, ?);";
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

    // app.patch("/gift/:id", async (req, res) => {
    //     try {
    //         const userId = getUserIDFromJWT(req);

    //         const eventId = req.params.id;
    //         const { event_name, start_date, changed_date } = req.body;
    //         if (!eventId || !event_name || !start_date)
    //             return res.status(500).send("Incomplete request");
    //         var query = "UPDATE events INNER JOIN event_assignments ON events.id = event_assignments.event_id SET events.name = ?, events.start_date = ? WHERE event_assignments.user_id = ? AND event_assignments.role = ? AND event_assignments.event_id = ? AND events.changed_date < ?;";
    //         var params = [event_name, start_date, userId, ROLE.ORGANISER, eventId, changed_date];
    //         //['urodziny', '2021-04-25', 1, 'Organiser', 1, '2020-10-15 02:00:00']
    //         const repsonse = await sql.query(query, params)
    //         if (repsonse.affectedRows === 0) {
    //             //CHECK FOR CONFLICT
    //             query = "SELECT * FROM events INNER JOIN event_assignments ON events.id WHERE event_assignments.user_id = ? AND event_assignments.role = ? AND event_assignments.event_id = ? AND events.changed_date > ?;";
    //             params = [userId, ROLE.ORGANISER, eventId, changed_date];
    //             const conflict = await sql.query(query, params);
    //             if (conflict.affectedRows !== 0)
    //                 return res.status(CONFLICT).send("Conflicted.");
    //             return res.status(BAD_REQUEST).send("Bad request.");
    //         }
    //         return res.status(OK).send("OK.")
    //     }
    //     catch (error) {
    //         console.log(error);
    //         res.status(BAD_REQUEST).send("Bad request")
    //     }
    // });

    app.get("/gifts/:eventId", auth, async (req, res) => {
        try {
            const eventId = req.params.eventId;
            const userId = getUserIDFromJWT(req);
            if (!eventId)
                return res.status(500).send("Incomplete request - event id missing");
            //retrive event elements
            var query = "SELECT g.id AS gift_id, g.name AS gift_name, g.description AS gift_description, g.changed_date AS gift_changed_date, r.max_users AS res_max_contributors, r.changed_date AS res_changed_date, IF(r.id IS NOT NULL, true, false) AS is_reserved, IF(a.user_id = ?, true, false) AS is_user_res FROM gifts g LEFT JOIN reservations r ON r.gift_id = g.id LEFT JOIN event_assignments a ON a.reservation_id = r.id WHERE g.event_id = ?;";
            const lines = await sql.query(query, [userId, eventId]);
            return res.status(200).json(lines);
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });
};