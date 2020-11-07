const express = require("express");
const bodyParser = require("body-parser");
var cors = require('cors')
const app = express();

app.use(cors()) // Use this after the variable declaration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/auth.js")(app);
require("./app/routes/user.js")(app);
require("./app/routes/event.js")(app);
require("./app/routes/gift.js")(app);
require("./app/routes/reservation.js")(app);

app.listen(6060, () => {
  console.log("Server is running on port 6060.");
});
