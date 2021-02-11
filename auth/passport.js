var passport = require("passport");

const DriverAcc = require("../models/driverModel");
const Admin = require("../models/adminModel");
const IndustryAcc = require("../models/industryModel");

module.exports = function (app) {
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use("driverLocal", DriverAcc.createStrategy());
  passport.use("industryLocal", IndustryAcc.createStrategy());
  passport.use("adminLocal", Admin.createStrategy());

  passport.serializeUser(function (user, done) {
    done(null, user);
  });

  passport.deserializeUser(function (user, done) {
    done(null, user);
  });
};
