"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED } = require("../config/helper.js");
const ROLE = { ORGANISER: "Organiser", GUEST: "Guest" };

module.exports = (app) => {
    app.post("/reservations", auth, async (req, res) => {
        try {
            const userId = getUserIDFromJWT(req);
            const { event_id, gift_id, max_users, contact_number, description } = req.body;
            if (!event_id || !gift_id || !max_users)
                return res.status(500).send("Incomplete request");

            //CHECK IF USER ALREADY HAS RESERVATIONS
            // query = "SELECT r.id FROM reservations r LEFT JOIN gifts g ON r.gift_id = g.id LEFT JOIN events e ON e.id = g.event_id LEFT JOIN event_assignments a ON a.event_id = e.id WHERE a.reservation_id = r.id AND a.user_id = ?;"
            // const checkReservations = await sql.query(query, [userId]);
            // if (checkReservations.length !== 0)
            //     return res.status(409).send(CONFLICT + ": User has already made a reservation");

            //CHECK IF USER IS ORGANISER OF GIFT'S EVENT
            var query = "SELECT g.id FROM gifts g LEFT JOIN events e ON e.id = g.event_id LEFT JOIN event_assignments a ON a.event_id = e.id WHERE a.role = 'Guest' AND g.id = ? AND a.user_id = ?;"
            const checkRole = await sql.query(query, [gift_id, userId]);
            if (checkRole.length === 0)
                return res.status(401).send(UNAUTHORIZED + ": User is not a guest of the event.");

            //CHECK FOR LATEST RESERVATION ID
            query = "SELECT id FROM reservations ORDER BY id DESC LIMIT 0, 1;";
            const latestIdRes = await sql.query(query);
            const newIdRes = latestIdRes.length !== 0 ? latestIdRes[0].id + 1 : 1;

            //CHECK FOR MAX USERS FOR OTHER RESERVATION OF THIS GIFT
            query = "SELECT max_users AS max_users FROM reservations r WHERE r.gift_id = ? LIMIT 0, 1;"
            const max = await sql.query(query, [gift_id])[0];
            if (max !== undefined && max.max_users !== undefined && max.max_users !== max_users) {
                return res.status(409).send(CONFLICT + "Max users for this request does not match with other reserations.");
            }
            const res_max_users = max === undefined ?
                max_users :
                max.max_users;
            //CHECK FOR EVENT ASSIGNMENT ID
            query = "SELECT a.id AS id FROM event_assignments a JOIN events e ON a.event_id = ? WHERE a.user_id = ? LIMIT 0, 1;"
            const assignment = await sql.query(query, [event_id, userId]);
            if (assignment.length === 0) {
                return res.status(400).send(BAD_REQUEST + "User assignment to an event not defined.")
            }
            //INSERT RESERVATION RECORD
            query = "INSERT INTO reservations (id, gift_id, assignment_id, contact_number, max_users, description) VALUES (?, ?, ?, ?, ?, ?);";
            var params = [newIdRes, gift_id, assignment[0].id, !contact_number ? null : contact_number, res_max_users, description];
            await sql.query(query, params);
            //END
            return res.status(CREATED).send("Created");
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });

    app.get("/reservations", auth, async (req, res) => {
        try {
            const gift_id = req.header("giftId");
            if (!gift_id)
                return res.status(500).send("Incomplete request - gift id missing");
            //RETRIVE EVENT ELEMENTS
            var query = "SELECT r.id AS id, r.description AS description, u.name AS user_name, u.email AS user_email, r.contact_number AS contact_number, a.event_id AS event_id, a.role AS role FROM reservations r LEFT JOIN event_assignments a ON r.assignment_id = a.id LEFT JOIN users u ON u.id = a.user_id where r.gift_id = ?;"
            const lines = await sql.query(query, [gift_id]);
            return res.status(200).json(lines);
        }
        catch (error) {
            console.log(error);
            res.status(BAD_REQUEST).send("Bad request");
        }
    });

    app.delete("/reservations", auth, async (req, res) => {
        try {
            const gift_id = req.header("giftId");
            const userId = getUserIDFromJWT(req);
            if (!gift_id) {
                return res.status(500).send("Incomplete request - gift id missing");
            }
            //CHECK OF RESERVATION ID
            var query = "SELECT r.id FROM reservations r JOIN event_assignments a ON a.id = r.assignment_id WHERE r.gift_id = ? AND a.user_id = ?;";
            const reservation = await sql.query(query, [gift_id, userId]);
            if (reservation.length < 1) {
                return res.status(409).send(BAD_REQUEST + ": Bad request, user has no reservations for this gift.")
            }
            //DELETE RESERVATION
            var query = "DELETE FROM reservations r WHERE ";
            var params = [];
            for (var i = 0; i < reservation.length; i++) {
                if (!reservation[i]);
                else {
                    query += "r.id = ? OR ";
                    params.push(reservation[i].id);
                }
            }
            query = query.substring(0, query.length - 3) + ";";
            await sql.query(query, params);
            return res.status(200).send("Deleted");
        } catch (error) {
            console.log(error);
            req.status(BAD_REQUEST.send("Bad request"))
        }
    });
};