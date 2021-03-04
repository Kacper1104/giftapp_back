"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED } = require("../config/helper.js");
const ROLE = { ORGANISER: "Organiser", GUEST: "Guest" };

module.exports = (app) => {
  app.post("/events", auth, async (req, res) => {
    try {
      const userId = getUserIDFromJWT(req);
      const { event_name, start_date } = req.body;
      const _start_date = start_date.substr(0, 10);
      if (!event_name || !_start_date)
        return res.status(500).send("Incomplete request");
      //CHECK FOR LATEST EVENT ID
      var query = "SELECT * FROM events ORDER BY id DESC LIMIT 0, 1;";
      const latestIdEvent = await sql.query(query);
      const newIdEvent = latestIdEvent.length !== 0 ? latestIdEvent[0].id + 1 : 1;
      //CHECK FOR LATEST EVENT_ASSIGNMENT ID
      query = "SELECT * FROM event_assignments ORDER BY id DESC LIMIT 0, 1;"
      const latestIdEventAssignment = await sql.query(query);
      const newIdEventAssignment = latestIdEventAssignment.length !== 0 ? latestIdEventAssignment[0].id + 1 : 1;
      //CHECK FOR USER WITH USER ID
      query = "SELECT * FROM users WHERE id = ?;";
      if (await sql.query(query, userId).length === 0)
        return res.status(401).send(UNAUTHORIZED + ": User record broken. Please contact administrator.")
      //INSERT EVENT RECORD
      query =
        "INSERT INTO events (id, name, start_date) VALUES (?, ?, ?);";
      var params = [newIdEvent, event_name, _start_date];
      await sql.query(query, params);
      //INSERT EVENT ASSIGNMENT RECORD
      query = "INSERT INTO event_assignments (id, role, user_id, event_id) VALUES (?, ?, ?, ?);";
      params = [newIdEventAssignment, ROLE.ORGANISER, userId, newIdEvent];
      await sql.query(query, params);

      //END
      return res.status(CREATED).send("Created");
    }
    catch (error) {
      console.log(error);
      res.status(BAD_REQUEST).send("Bad request");
    }
  });

  app.post("/events/join", auth, async (req, res) => {
    try {
      const userId = getUserIDFromJWT(req);
      const code = req.header("code");
      //console.log(code);
      if (!code)
        return res.status(500).send("Incomplete request - code missing");
      //VALIDATE CODE
      var query = "SELECT * FROM codes WHERE code = ? AND is_active = 1 LIMIT 0, 1;";
      const codeExists = await sql.query(query, code);
      if (codeExists.length === 0)
        return res.status(BAD_REQUEST).send("Code not found or inactive")
      //GET EVENT
      query = "SELECT id FROM events WHERE id = ? AND is_active = 1 LIMIT 0, 1;";
      const event = await sql.query(query, code);
      if (event.length === 0)
        return res.status(BAD_REQUEST).send("Event not found or inactive")
      //CHECK IF USER IS IN THIS EVENT
      query = "SELECT id FROM event_assignments WHERE event_id = ? AND user_id = ? LIMIT 0, 1;";
      const assignment = await sql.query(query, [event[0].id, userId]);
      if (assignment.length !== 0)
        return res.status(CONFLICT).send("User already assigned.")
      //CHECK FOR LATEST EVENT_ASSIGNMENT ID
      query = "SELECT * FROM event_assignments ORDER BY id DESC LIMIT 0, 1;"
      const latestIdEventAssignment = await sql.query(query);
      const newIdEventAssignment = latestIdEventAssignment.length !== 0 ? latestIdEventAssignment[0].id + 1 : 1;
      //CREATE ASSIGNMENT
      query = "INSERT INTO event_assignments (id, role , user_id, event_id) VALUES (?, ?, ?, ?);";
      var params = [newIdEventAssignment, ROLE.GUEST, userId, event[0].id];
      await sql.query(query, params);
      //DEACTIVETE CODE
      query = "UPDATE codes SET is_active = false WHERE id = ?;"
      await sql.query(query, codeExists[0].id);
      return res.status(200).send("OK");
      //END
    }
    catch (error) {
      console.log(error);
      res.status(BAD_REQUEST).send("Bad request");
    }
  });

  app.get("/events", auth, async (req, res) => {
    try {
      const userId = getUserIDFromJWT(req);
      const offset = parseInt(req.header(`offset`));
      const pageSize = parseInt(req.header(`pageSize`));
      if (!offset || !pageSize)
        return res.status(500).send("Incomplete request - paging missing");
      //retrive event elements
      var query = "SELECT e.id, e.name, e.start_date, e.is_active, a.id, a.role, h.name AS host FROM events e LEFT JOIN event_assignments a ON e.id = a.event_id LEFT JOIN event_assignments ha ON ha.role = 'Organiser' LEFT JOIN users h ON h.id = ha.user_id WHERE a.user_id = ? ORDER BY e.created_date DESC LIMIT ? OFFSET ?;";
      const lines = await sql.query(query, [userId, pageSize, offset - 1]);
      return res.status(200).json(lines);
    }
    catch (error) {
      console.log(error);
      res.status(BAD_REQUEST).send("Bad request");
    }
  });

  app.get("/events/:id", auth, async (req, res) => {
    try {
      const eventId = req.params.id;
      const userId = getUserIDFromJWT(req);
      if (!eventId)
        return res.status(500).send("Incomplete request - event id missing");
      //retrive event elements
      var query = "SELECT e.id AS id, e.name AS event_name, e.start_date AS start_date, e.is_active as is_active, e.created_date AS created_date, e.changed_date AS changed_date, a.id AS assignment_id, a.role AS role, a.reservation_id AS reservation_id, a.created_date AS assignment_created_date, a.changed_date AS assignment_changed_date FROM events e LEFT JOIN event_assignments a ON e.id = a.event_id WHERE a.user_id = ?  AND e.id = ? LIMIT 0, 1;";
      const lines = await sql.query(query, [userId, eventId]);
      return res.status(200).json(lines);
    }
    catch (error) {
      console.log(error);
      res.status(BAD_REQUEST).send("Bad request");
    }
  });
};