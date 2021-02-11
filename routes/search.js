const express = require("express");
const router = express.Router();
const DriverAcc = require("../models/driverModel");

const ensureAuthenticated = require("../utils/authenticated");

const { setBookingDetails, setBookingId } = require("../utils/bookingDetails");

router.post("/search", ensureAuthenticated, (req, res) => {
  let fromAddress = req.body.fromAddress;
  let toAddress = req.body.toAddress;
  let date = req.body.date;
  let material = req.body.material;
  let weight = req.body.weight;
  let trucks = req.body.trucks;

  setBookingDetails(fromAddress, toAddress, material, weight, trucks, date);

  DriverAcc.find({ status: true, verified: true }, function (err, drivers) {
    res.render("search", {
      drivers,
      fromAddress,
      toAddress,
      material,
      weight,
      trucks,
      date,
    });
  }).sort({ avgRating: -1 });
});

router.get("/search/:id", ensureAuthenticated, (req, res) => {
  const id = req.params.id;
  setBookingId(id);

  DriverAcc.findById(id, function (err, driver) {
    res.render("driverProfile", {
      driver,
    });
  });
});

exports.bookingId;

module.exports = router;
