const mongoose = require("mongoose");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const transactionsSchema = {
  id: String,
  status: String,
  date: String,
};

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

industryLoginSchema.plugin(passportLocalMongoose);

const IndustryAcc = new mongoose.model("IndustryAcc", industryLoginSchema);

module.exports = IndustryAcc;
