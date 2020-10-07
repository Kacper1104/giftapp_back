const express = require("express");
const bodyParser = require("body-parser");

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

require("./app/routes/auth.js")(app);
require("./app/routes/user.js")(app);
require("./app/routes/event.js")(app);

app.listen(6060, () => {
  console.log("Server is running on port 6060.");
});
