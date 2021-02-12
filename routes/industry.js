const express = require("express");
const router = express.Router();
const passport = require("passport");
const IndustryAcc = require("../models/industryModel");
const DriverAcc = require("../models/driverModel");
const Transaction = require("../models/transactionModel");
const transporter = require("../utils/transporter");

const ensureAuthenticated = require("../utils/authenticated.js");

router.get("/industrylogin", (req, res) => {
  res.render("industryLogin");
});

router.get("/profiledashboard", ensureAuthenticated, (req, res) => {
  res.render("profileDashboard", {
    currentUser: req.user,
  });
});

router.get("/industrydashboard", ensureAuthenticated, (req, res) => {
  res.render("industry", {
    currentUser: req.user,
  });
});

router.get("/industryprofile", ensureAuthenticated, (req, res) => {
  res.render("industryProfile", {
    currentUser: req.user,
  });
});

router.post("/industrysignin", (req, res) => {
  IndustryAcc.register(
    { username: req.body.username, email: req.body.email, phoneNo: req.body.phoneNo },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
      } else {
        passport.authenticate("industryLocal")(req, res, function () {
          res.redirect("/profiledashboard");
        });
      }
    }
  );
});

router.post("/industrylogin", function (req, res) {
  const acc = new IndustryAcc({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(acc, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("industryLocal")(req, res, function () {
        res.redirect("/profiledashboard");
      });
    }
  });
});

router.post("/industryeditprofile", ensureAuthenticated, function (req, res) {
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
});

router.get("/pastbookings", ensureAuthenticated, (req, res) => {
  IndustryAcc.findOne({ username: `${req.user.username}` }, function (err, acc) {
    res.render("pastBookings", {
      user: acc,
    });
  });
});

let paymentReceiptId;

// Set your secret key. Remember to switch to your live secret key in production!
// See your keys here: https://dashboard.stripe.com/account/apikeys
const Stripe = require("stripe");
const stripe = Stripe(`${process.env.STRIPE_SECRET_KEY}`);

router.post("/create-checkout-session", ensureAuthenticated, async (req, res) => {
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
    cancel_url: "https://vlink-transport.herokuapp.com/profiledashboard",
  });

  paymentReceiptId = session.id;

  res.json({ id: session.id });
});

router.post("/sendmail", (req, res) => {
  var message = {
    from: "yashkadam872@gmail.com",
    to: "muzzamilvalor@gmail.com",
    subject: `Feedback form from ${req.body.name}`,
    html: `
   <p> Name : ${req.body.name} </p>
   <p> Email : ${req.body.email} </p>

   <p> Subject : ${req.body.subject} </p>

   <p> Message : ${req.body.message} </p>
    `,
  };

  transporter.sendMail(message, (err, info) => {
    if (err) {
      console.log(err);
    } else {
      console.log("Email sent" + info.response);
      res.redirect("/");
    }
  });
});

const { getBookingDetails, getBookingId } = require("../utils/bookingDetails");

router.get("/success", async (req, res) => {
  const bookingId = getBookingId();
  console.log(bookingId);
  const bookingDetails = getBookingDetails();

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

module.exports = router;
