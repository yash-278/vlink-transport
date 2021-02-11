const nodemailer = require("nodemailer");

module.exports = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 587,
  secure: 465,
  auth: {
    user: "yashkadam872@gmail.com",
    pass: `${process.env.SMTP_PASS}`,
  },
});
