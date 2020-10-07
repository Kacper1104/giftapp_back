"use strict";

const sql = require("../models/db.js");
const { auth } = require("../config/JWT");

module.exports = (app) => {
  app.post("/events", auth, async (req, res) => {
    const { organiser_id, event_name, start_date } = req.body;
    if (!organiser_id || !event_name || !start_date)
      return res.status(500).send("Incomplete request");
    //CHECK FOR LATEST ID
    var query = "SELECT * FROM events ORDER BY id DESC LIMIT 0, 1;";
    const latestIdEvent = await sql.query(query);
    const latestId = latestIdEvent.length !== 0 ? latestIdEvent[0].id + 1 : 1;
    //INSERT RECORD
    query =
      "INSERT INTO events (id, organiser_id, event_name, start_date, isActive) VALUES (?, ?, ?, ?, ?)";
    var params = [latestId, organiser_id, event_name, start_date, true];
    sql.query(query, params);
    return res.status(201).send("Created");
  });
};
