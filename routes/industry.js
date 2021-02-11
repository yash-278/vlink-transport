const express = require("express");
const router = express.Router();
const passport = require("passport");
const IndustryAcc = require("../models/industryModel");

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

module.exports = router;
