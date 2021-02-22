const express = require("express");
const bodyParser = require("body-parser");
var cors = require("cors");
const app = express();

app.use(cors()); // Use this after the variable declaration
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

if (process.env.NODE_ENV === "production") {
	// Exprees will serve up production assets
	app.use(express.static("client/build"));

	// Express serve up index.html file if it doesn't recognize route
	app.get("*", (req, res) => {
		res.sendFile(path.resolve(__dirname, "client", "build", "index.html"));
	});
}

require("./app/routes/auth.js")(app);
require("./app/routes/user.js")(app);
require("./app/routes/event.js")(app);
require("./app/routes/gift.js")(app);
require("./app/routes/reservation.js")(app);
require("./app/routes/code.js")(app);

app.listen(process.env.PORT || 6060, () => {
	console.log("Server is running on port 6060.");
});
