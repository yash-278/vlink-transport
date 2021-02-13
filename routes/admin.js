const express = require("express");
const router = express.Router();
const passport = require("passport");
const Admin = require("../models/adminModel");
const DriverAcc = require("../models/driverModel");
const IndustryAcc = require("../models/industryModel");

const ensureAuthenticated = require("../utils/authenticated");

router.get("/admin", function (req, res) {
  res.render("adminLogin");
});

router.get("/admindashboard", ensureAuthenticated, function (req, res) {
  res.render("admin");
});

router.post("/adminlogin", (req, res) => {
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

router.get("/driver", ensureAuthenticated, (req, res) => {
  res.render("driverAdd");
});

router.get("/addIndustry", ensureAuthenticated, (req, res) => {
  res.render("addIndustry");
});

router.post("/addIndustry", ensureAuthenticated, (req, res) => {
  const id = req.body.id;

  IndustryAcc.findByIdAndUpdate(id, { verified: true }, function (err) {
    if (!err) {
      res.redirect("/admindashboard");
    } else {
      console.log(err);
    }
  });
});

router.post("/driveradd", ensureAuthenticated, (req, res) => {
  const id = req.body.id;
  const name = req.body.driverName;
  const address = req.body.driverAddress;
  const phoneNo = req.body.driverNumber;
  const licensePlate = req.body.licenseNumber;
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
    licensePlate,
    verified: true,
  };

  DriverAcc.findByIdAndUpdate(id, driver, function (err) {
    if (!err) {
      res.redirect("/admindashboard");
    } else {
      console.log(err);
    }
  });
});

module.exports = router;
