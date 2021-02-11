const express = require("express");
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");

const transporter = require("../utils/transporter");

const DriverAcc = require("../models/driverModel");
const IndustryAcc = require("../models/industryModel");

const ensureAuthenticated = require("../utils/authenticated");

// Disk Storage for Email System

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  },
});

var upload = multer({
  storage,
}).array("images");

router.get("/industryverify", ensureAuthenticated, (req, res) => {
  res.render("industryVerification", {
    currentUser: req.user,
  });
});

router.post("/industryverify", ensureAuthenticated, (req, res) => {
  upload(req, res, function (err) {
    if (err) {
      console.log(err);
    } else {
      var addedAttachments = [];

      const path = req.files.forEach((file) => {
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

router.get("/driververify", ensureAuthenticated, (req, res) => {
  res.render("driverVerification", {
    currentUser: req.user,
  });
});

router.post("/driververify", ensureAuthenticated, (req, res) => {
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
        <p>License Plate Number : ${req.body.licenseNumber}</p>
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

module.exports = router;
