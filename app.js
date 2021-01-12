const express = require("express");
const bodyParser = require("body-parser");
let ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));

app.use(
  session({
    secret: "My little vLink database secret",
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect("mongodb+srv://vLink:12345@cluster0.3audl.mongodb.net/vLinkDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Mongoose Schema

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const driverLoginSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const driverSchema = new mongoose.Schema({
  name: String,
  desc: String,
  rating: String,
});

adminSchema.plugin(passportLocalMongoose);
driverLoginSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
const DriverAcc = new mongoose.model("DriverAcc", driverLoginSchema);
const Driver = new mongoose.model("Driver", driverSchema);

passport.use("adminLocal", Admin.createStrategy());
passport.use("driverLocal", DriverAcc.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  if (user != null) done(null, user);
});

//  ============== GET / POST Requests =================

app.get("/", (req, res) => {
  if (req.user === undefined) {
    res.render("index", {
      currentUser: "Not Logged In",
    });
  } else {
    currentUser = req.user.username;
    res.render("index", {
      currentUser,
    });
  }
});

app.post("/search", (req, res) => {
  let fromAddress = req.body.fromAddress;
  let toAddress = req.body.toAddress;
  let date = req.body.date;

  Driver.find({}, function (err, drivers) {
    console.log(drivers);
    res.render("search", {
      drivers,
      fromAddress,
      toAddress,
      date,
    });
  });
});

// ============ Driver Login ===============

app.get("/driverlogin", (req, res) => {
  res.render("driverLogin");
});

app.get("/driverdashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("driver", {
      currentUser: req.user,
    });
  } else {
    res.redirect("/driverlogin");
  }
});

app.post("/driversignin", (req, res) => {
  DriverAcc.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
      // res.redirect("/driverlogin");
    } else {
      passport.authenticate("driverLocal")(req, res, function () {
        res.redirect("/driverdashboard");
      });
    }
  });
});

app.post("/driverlogin", function (req, res) {
  const driver = new DriverAcc({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(driver, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("driverLocal")(req, res, function () {
        res.redirect("/driverdashboard");
      });
    }
  });
});

// ============ Admin Login ===============

app.get("/admin", (req, res) => {
  res.render("adminLogin");
});

app.get("/admindashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("admin");
  } else {
    res.redirect("/admin");
  }
});

app.post("/adminlogin", function (req, res) {
  const admin = new Admin({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(admin, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("adminLocal")(req, res, function () {
        res.redirect("/admindashboard");
      });
    }
  });
});

// ============ Add Driver Data ============

app.get("/driver", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("addDriver");
  } else {
    res.redirect("/");
  }
});

app.post("/driveradd", (req, res) => {
  const name = req.body.driverName;
  const desc = req.body.driverDesc;
  const rating = req.body.rating;

  const driver = new Driver({
    name,
    desc,
    rating,
  });

  driver.save(function (err) {
    if (!err) {
      res.redirect("/admindashboard");
    }
  });
});

app.get("/logout", function (req, res) {
  req.logout();
  res.redirect("/");
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
app.listen(port);
