const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const ratingSchema = {
  id: String,
  rating: Number,
};

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
  licensePlate: String,
  verified: Boolean,
  status: Boolean,
  avgRating: String,
  rating: [ratingSchema],
});

driverLoginSchema.plugin(passportLocalMongoose);

const DriverAcc = new mongoose.model("DriverAcc", driverLoginSchema);

module.exports = DriverAcc;
