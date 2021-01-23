const express = require("express");
const fs = require("fs");
const bodyParser = require("body-parser");
let ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const nodemailer = require("nodemailer");
const multer = require("multer");
const { nextTick } = require("process");

const app = express();

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  },
});

var upload = multer({
  storage,
}).array("images");

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

const industryLoginSchema = new mongoose.Schema({
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
industryLoginSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
const DriverAcc = new mongoose.model("DriverAcc", driverLoginSchema);
const IndustryAcc = new mongoose.model("IndustryAcc", industryLoginSchema);
const Driver = new mongoose.model("Driver", driverSchema);

passport.use("adminLocal", Admin.createStrategy());
passport.use("driverLocal", DriverAcc.createStrategy());
passport.use("industryLocal", IndustryAcc.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  if (user != null) done(null, user);
});

let transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: 465,
  auth: {
    user: "yashkadam872@gmail.com",
    pass: "9833379003",
  },
});

//  ============== GET / POST Requests =================

app.get("/", (req, res) => {
  res.render("homepage");
});

app.post("/search", (req, res) => {
  let fromAddress = req.body.fromAddress;
  let toAddress = req.body.toAddress;
  let date = req.body.date;
  let material = req.body.material;
  let weight = req.body.weight;
  let trucks = req.body.trucks;

  console.log(req.body);

  Driver.find({}, function (err, drivers) {
    // console.log(drivers);
    res.render("search", {
      drivers,
      fromAddress,
      toAddress,
      material,
      weight,
      trucks,
      date,
    });
  });
});

app.get("/search/:id", (req, res) => {
  const id = req.params.id;
  // console.log(id);
  Driver.findById(id, function (err, driver) {
    res.render("driverProfile", {
      driver,
    });
  });
});

// ============ Industry Login ==============

app.get("/industrylogin", (req, res) => {
  res.render("industryLogin");
});

app.get("/industrydashboard", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("industry", {
      currentUser: req.user,
    });
  } else {
    res.redirect("/industrylogin");
  }
});

app.post("/industrysignin", (req, res) => {
  IndustryAcc.register({ username: req.body.username }, req.body.password, function (err, user) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("industryLocal")(req, res, function () {
        res.redirect("/industrydashboard");
      });
    }
  });
});

app.post("/industrylogin", function (req, res) {
  const driver = new IndustryAcc({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(driver, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("industryLocal")(req, res, function () {
        res.redirect("/industrydashboard");
      });
    }
  });
});

// ============ Industry Verify ==============

app.get("/industryverify", (req, res) => {
  res.render("industryVerification", {
    currentUser: req.user,
  });
});

app.post("/industryverify", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
    } else {
      var addedAttachments = [];

      var path = req.files.forEach((file) => {
        addedAttachments.push({ path: file.path });
      });

      let message = {
        from: "yashkadam872@gmail.com",
        to: "muzzamilvalor@gmail.com",
        subject: `Verification Application by ${req.body.fname}`,
        html: `
        <p>Name : ${req.body.fname}</p>
        <p>Email : ${req.body.email}</p>
        <p>Ph. Number : ${req.body.phNumber} </p>
        `,
        attachments: addedAttachments,
      };
      transporter.sendMail(message, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Email sent" + info.response);

          req.files.forEach((file) => {
            fs.unlink(file.path, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("Success in delete file");
              }
            });
          });

          res.redirect("/industrydashboard");
        }
      });
    }
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

// ============ Driver Verification ==========

app.get("/driververify", (req, res) => {
  res.render("driverVerification", {
    currentUser: req.user,
  });
});

app.post("/driververify", (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
    } else {
      var addedAttachments = [];

      var path = req.files.forEach((file) => {
        addedAttachments.push({ path: file.path });
      });

      let message = {
        from: "yashkadam872@gmail.com",
        to: "muzzamilvalor@gmail.com",
        subject: `Verification Application by ${req.body.fname}`,
        html: `
        <p>Name : ${req.body.fname}</p>
        <p>Email : ${req.body.email}</p>
        <p>Ph. Number : ${req.body.phNumber} </p>
        `,
        attachments: addedAttachments,
      };

      transporter.sendMail(message, (err, info) => {
        if (err) {
          console.log(err);
        } else {
          console.log("Email sent" + info.response);

          req.files.forEach((file) => {
            fs.unlink(file.path, function (err) {
              if (err) {
                console.log(err);
              } else {
                console.log("Success in delete file");
              }
            });
          });

          res.redirect("/driverdashboard");
        }
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
    res.render("driverAdd");
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
