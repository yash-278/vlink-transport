const nodemailer = require("nodemailer");
const path = require("path");
const multer = require("multer");

// Disk Storage for Email System

var storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "../uploads");
  },
  filename: function (req, file, cb) {
    cb(null, `${file.fieldname}-${Date.now()}-${file.originalname}`);
  },
});

exports.transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: 465,
  auth: {
    user: "yashkadam872@gmail.com",
    pass: `${process.env.SMTP_PASS}`,
  },
});

var upload = multer({
  storage,
}).array("images");
