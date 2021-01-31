const dotenv = require("dotenv");
dotenv.config();
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

app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(`${process.env.MONGOOSE_URL}`, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useFindAndModify: false,
});

// Disk Storage for Email System

var diskStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./images");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  },
});

var upload = multer({
  diskStorage,
}).array("images");

// Mongoose Schema

const transactionsSchema = {
  id: String,
  status: String,
  date: String,
};

const Transaction = mongoose.model("Transaction", transactionsSchema);

const adminSchema = new mongoose.Schema({
  username: String,
  password: String,
});

const driverLoginSchema = new mongoose.Schema({
  username: String,
  password: String,
  name: String,
  phoneNo: String,
  address: String,
  preferredCities: String,
  fixedRoute: String,
  vehicleType: String,
  vehicleCapacity: String,
  verified: Boolean,
  status: Boolean,
});

const industryLoginSchema = new mongoose.Schema({
  username: String,
  password: String,
  email: String,
  phoneNo: String,
  address: String,
  companyName: String,
  verified: Boolean,
  transactions: [transactionsSchema],
});

adminSchema.plugin(passportLocalMongoose);
driverLoginSchema.plugin(passportLocalMongoose);
industryLoginSchema.plugin(passportLocalMongoose);

const Admin = new mongoose.model("Admin", adminSchema);
const DriverAcc = new mongoose.model("DriverAcc", driverLoginSchema);
const IndustryAcc = new mongoose.model("IndustryAcc", industryLoginSchema);
// const DriverAcc = new mongoose.model("DriverAcc", driverSchema);

passport.use("adminLocal", Admin.createStrategy());
passport.use("driverLocal", DriverAcc.createStrategy());
passport.use("industryLocal", IndustryAcc.createStrategy());

passport.serializeUser(function (user, done) {
  done(null, user);
});

passport.deserializeUser(function (user, done) {
  done(null, user);
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

// @route GET /
// @desc Loads Homepage
app.get("/", (req, res) => {
  res.render("homepage");
});

let bookingDetails;

app.post("/search", (req, res) => {
  let fromAddress = req.body.fromAddress;
  let toAddress = req.body.toAddress;
  let date = req.body.date;
  let material = req.body.material;
  let weight = req.body.weight;
  let trucks = req.body.trucks;

  bookingDetails = {};

  bookingDetails = { fromAddress, toAddress, material, weight, trucks, date };

  DriverAcc.find({ status: true, verified: true }).then((drivers) => {
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

let bookingId = "";

app.get("/search/:id", (req, res) => {
  const id = req.params.id;
  bookingId = req.params.id;

  DriverAcc.findById(id, function (err, driver) {
    res.render("driverProfile", {
      driver,
    });
  });
});

app.get("/pastbookings", (req, res) => {
  if (req.isAuthenticated()) {
    IndustryAcc.findOne({ username: `${req.user.username}` }, function (err, acc) {
      res.render("pastBookings", {
        user: acc,
      });
    });
  }
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

app.get("/industryprofile", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("industryProfile", {
      currentUser: req.user,
    });
  } else {
    res.redirect("/industrydashboard");
  }
});

app.post("/industrysignin", (req, res) => {
  IndustryAcc.register(
    { username: req.body.username, email: req.body.email, phoneNo: req.body.phoneNo },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("industryLocal")(req, res, function () {
          res.redirect("/industrydashboard");
        });
      }
    }
  );
});

app.post("/industrylogin", function (req, res) {
  const acc = new IndustryAcc({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(acc, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("industryLocal")(req, res, function () {
        res.redirect("/industrydashboard");
      });
    }
  });
});

app.post("/industryeditprofile", function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user._id;
    let params = {};
    for (let prop in req.body) if (req.body[prop]) params[prop] = req.body[prop];

    IndustryAcc.findByIdAndUpdate(id, params, function (err) {
      IndustryAcc.findById(id, function (err, doc) {
        req.logIn(doc, function (err1) {
          if (err1) {
            console.log("Error : " + err1);
          } else {
            res.render("industryProfile", {
              currentUser: req.user,
            });
          }
        });
      });
    });
  } else {
    res.redirect("/industrydashboard");
  }
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
        <p>ID : ${req.user._id}</p>
        <p>Name : ${req.body.fname}</p>
        <p>Email : ${req.body.email}</p>
        <p>Ph. Number : ${req.body.phNumber} </p>
        <p>Address : ${req.body.address}</p>
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
// ============ DriverAcc Login ===============

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

app.get("/updatestatus/:status", (req, res) => {
  status = req.params.status;
  console.log(status);
  const id = req.user._id;
  if (status === "available") {
    DriverAcc.findByIdAndUpdate(id, { status: true }, function (err) {
      DriverAcc.findById(id, function (err, doc) {
        req.logIn(doc, function (err1) {
          if (err1) {
            console.log("Error : " + err1);
          } else {
            res.render("driver", {
              currentUser: req.user,
            });
          }
        });
      });
    });
  } else {
    DriverAcc.findByIdAndUpdate(id, { status: false }, function (err) {
      DriverAcc.findById(id, function (err, doc) {
        req.logIn(doc, function (err1) {
          if (err1) {
            console.log("Error : " + err1);
          } else {
            res.render("driver", {
              currentUser: req.user,
            });
          }
        });
      });
    });
  }
});

app.post("/drivereditprofile", function (req, res) {
  if (req.isAuthenticated()) {
    const id = req.user._id;
    let params = {};
    for (let prop in req.body) if (req.body[prop]) params[prop] = req.body[prop];

    DriverAcc.findByIdAndUpdate(id, params, function (err) {
      DriverAcc.findById(id, function (err, doc) {
        req.logIn(doc, function (err1) {
          if (err1) {
            console.log("Error : " + err1);
          } else {
            res.render("driver", {
              currentUser: req.user,
            });
          }
        });
      });
    });
  } else {
    res.redirect("/driver");
  }
});

// ============ DriverAcc Verification ==========

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
        <p>ID : ${req.user._id}</p>
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

// ============ Add DriverAcc Data ============

app.get("/driver", (req, res) => {
  if (req.isAuthenticated()) {
    res.render("driverAdd");
  } else {
    res.redirect("/");
  }
});

app.post("/driveradd", (req, res) => {
  const id = req.body.id;
  const name = req.body.driverName;
  const address = req.body.driverAddress;
  const phoneNo = req.body.driverNumber;
  const preferredCities = req.body.driverPreference;
  const fixedRoute = req.body.driverRoute;
  const vehicleType = req.body.driverVehicle;
  const vehicleCapacity = req.body.driverCapacity;

  const driver = {
    name,
    address,
    phoneNo,
    preferredCities,
    fixedRoute,
    vehicleType,
    vehicleCapacity,
    verified: true,
  };

  DriverAcc.findByIdAndUpdate(id, driver, function (err) {
    if (!err) {
      res.redirect("/admindashboard");
    } else {
      console.log(err);
    }
  });

  // driver.save(function (err) {
  //   if (!err) {
  //     res.redirect("/admindashboard");
  //   }
  // });
});

// ======================================================================================

let paymentReceiptId;

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const Stripe = require("stripe");
const stripe = Stripe(`${process.env.STRIPE_SECRET_KEY}`);

app.post("/create-checkout-session", async (req, res) => {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: "Book Truck",
          },
          unit_amount: 200000,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `https://vlink-transport.herokuapp.com/success`,
    cancel_url: "https://example.com/cancel",
  });

  paymentReceiptId = session.id;

  res.json({ id: session.id });
});

app.get("/success", async (req, res) => {
  DriverAcc.findById(bookingId, function (err, driver) {
    var message = {
      from: "yashkadam872@gmail.com",
      to: "muzzamilvalor@gmail.com",
      subject: `Booking Request by ${req.user.username}`,
      html: `

      <h2>${req.user.username} has paid : Rs 2000/-</h2>
      <p>ID : ${req.user._id}</p>
      <p>Client Name : ${req.user.username}</p>
      =====================================================
      DriverAcc Details
      =====================================================
      <p>DriverAcc Name : ${driver.name}</p>
      <p>DriverAcc Phone no. : ${driver.phoneNo}</p>
      =====================================================
      Booking Details
      =====================================================
      <p>Pickup Address : ${bookingDetails.fromAddress}</p>
      <p>Drop Address : ${bookingDetails.toAddress}</p>
      <p>Material : ${bookingDetails.material}</p>
      <p>Weight : ${bookingDetails.weight}</p>
      <p>Truck : ${bookingDetails.trucks}</p>
      <p>Date of Transport : ${bookingDetails.date}</p>
      `,
    };
    transporter.sendMail(message, (err, info) => {
      if (err) {
        console.log(err);
      } else {
        console.log("Email sent" + info.response);
      }
    });
  });

  const session = await stripe.checkout.sessions.retrieve(`${paymentReceiptId}`);

  var d = new Date();
  var months = [
    "January",
    "February",
    "March",
    "April",
    "May",
    "June",
    "July",
    "August",
    "September",
    "October",
    "November",
    "December",
  ];

  const transaction = new Transaction({
    id: session.payment_intent,
    status: session.payment_status,
    date: `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`,
  });

  IndustryAcc.findOne({ username: req.user.username }, function (err, foundAcc) {
    foundAcc.transactions.push(transaction);
    foundAcc.save();
  });

  let paymentReceipt = {
    from: "yashkadam872@gmail.com",
    to: `${req.user.email}`,
    subject: `Booking Request confirmed from ${req.user.username}`,
    html: `
    <h2>${req.user.username}, we have recieved your Rs 2000/-</h2>

    =======================================
   <p> Payment Receipt</p>
    =======================================
   
    <p> Receipt Id : ${session.payment_intent} </p>

    <p> Payment Method : Card </p>

    <p> Payment Status : ${session.payment_status} </p>

    <p> Amount Total : Rs ${session.amount_total / 100}/- </p>

    <p> Advance Payment of 2000/- has been done successfully.. </p>
    <p> We'll contact you shortly.. </p>

    ===========================
    <p> Booking Details</p>
    ===========================
    <p>Pickup Address : ${bookingDetails.fromAddress}</p>
    <p>Drop Address : ${bookingDetails.toAddress}</p>
    <p>Material : ${bookingDetails.material}</p>
    <p>Weight : ${bookingDetails.weight}</p>
    <p>Truck : ${bookingDetails.trucks}</p>
    <p>Date of Transport : ${bookingDetails.date}</p>
    
    `,
  };
  transporter.sendMail(paymentReceipt, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent" + info.response);
      res.redirect("/industrydashboard");
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
