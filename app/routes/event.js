"use strict";

const sql = require("../models/db.js");
const { auth, getUserIDFromJWT } = require("../config/JWT");
const { UNAUTHORIZED, BAD_REQUEST, CONFLICT, OK, CREATED } = require("../config/helper.js");
const ROLE = {ORGANISER: "Organiser", GUEST: "Guest"};

module.exports = (app) => {
  app.post("/events", auth, async (req, res) => {
    try{
      const userId = getUserIDFromJWT(req);
      const { event_name, start_date } = req.body;
      if (!event_name || !start_date)
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
      if(await sql.query(query, userId).length === 0)
        return res.status(401).send(UNAUTHORIZED+": User record broken. Please contact administrator.")
      //INSERT EVENT RECORD
      query =
        "INSERT INTO events (id, name, start_date) VALUES (?, ?, ?);";
      var params = [newIdEvent, event_name, start_date];
      sql.query(query, params);
      //INSERT EVENT ASSIGNMENT RECORD
      query = "INSERT INTO event_assignments (id, role, user_id, event_id) VALUES (?, ?, ?, ?);";
      params = [newIdEventAssignment, ROLE.ORGANISER, userId, newIdEvent];
      sql.query(query, params); 
      //END
      return res.status(CREATED).send("Created");
    }
    catch(error){
      console.log(error);
      res.status(BAD_REQUEST).send("Bad request");
    }
  });

  app.patch("/events/:id", async (req, res) => {
      try{
        //const userId = getUserIDFromJWT(req);
        const userId = 1;
        const eventId = req.params.id;
        const { event_name, start_date, changed_date } = req.body;
        if (!eventId || !event_name || !start_date)
          return res.status(500).send("Incomplete request");
        var query = "UPDATE events INNER JOIN event_assignments ON events.id = event_assignments.event_id SET events.name = ?, events.start_date = ? WHERE event_assignments.user_id = ? AND event_assignments.role = ? AND event_assignments.event_id = ? AND events.changed_date < ?;";
        var params = [event_name, start_date, userId, ROLE.ORGANISER, eventId, changed_date];
        //['urodziny', '2021-04-25', 1, 'Organiser', 1, '2020-10-15 02:00:00']
        const repsonse = await sql.query(query, params)
        if(repsonse.affectedRows === 0){
          //CHECK FOR CONFLICT
          query = "SELECT * FROM events INNER JOIN event_assignments ON events.id WHERE event_assignments.user_id = ? AND event_assignments.role = ? AND event_assignments.event_id = ? AND events.changed_date > ?;";
          params = [ userId, ROLE.ORGANISER, eventId, changed_date];
          const conflict = await sql.query(query, params);
          if(conflict.affectedRows !== 0) 
            return res.status(CONFLICT).send("Conflicted.");
          return res.status(BAD_REQUEST).send("Bad request.");
        }
        return res.status(OK).send("OK.")
      }
      catch(error){console.log(error);
        res.status(BAD_REQUEST).send("Bad request")
      }
  });
};