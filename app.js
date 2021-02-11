const dotenv = require("dotenv");
dotenv.config();
const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
let ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const ensureAuthenticated = require("./utils/authenticated");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

app.use(
  session({
    secret: "My little vLink database secret",
    resave: false,
    saveUninitialized: false,
  })
);

mongoose.connect(`${process.env.MONGOOSE_URL}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

const adminRouter = require("./routes/admin.js");
const driverRouter = require("./routes/driver.js");
const industryRouter = require("./routes/industry.js");
const searchRouter = require("./routes/search.js");
const verificationRouter = require("./routes/verification.js");
const paymentRouter = require("./routes/stripePayment.js");

require("./auth/passport.js")(app);

app.use(adminRouter);
app.use(driverRouter);
app.use(industryRouter);
app.use(searchRouter);
app.use(verificationRouter);
app.use(paymentRouter);

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

app.get("/pastbookings", ensureAuthenticated, (req, res) => {
  IndustryAcc.findOne({ username: `${req.user.username}` }, function (err, acc) {
    res.render("pastBookings", {
      user: acc,
    });
  });
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
