const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
let ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoStore = require("connect-mongo")(session);

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(`${process.env.MONGOOSE_URL}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

app.use(
  session({
    secret: "My little vLink database secret",
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({ mongooseConnection: mongoose.connection }),
  })
);

const adminRouter = require("./routes/admin.js");
const driverRouter = require("./routes/driver.js");
const industryRouter = require("./routes/industry.js");
const searchRouter = require("./routes/search.js");
const verificationRouter = require("./routes/verification.js");

require("./auth/passport.js")(app);

app.use(adminRouter);
app.use(driverRouter);
app.use(industryRouter);
app.use(searchRouter);
app.use(verificationRouter);

//  ============== GET / POST Requests =================

// @route GET /
// @desc Loads Homepage
app.get("/", (req, res) => {
  res.render("homepage");
});

app.get("/about", (req, res) => {
  res.render("about-us");
});

app.get("/contact", (req, res) => {
  res.render("contact-us");
});

// ======================================================================================

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
