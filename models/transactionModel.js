const mongoose = require("mongoose");

const transactionsSchema = {
  id: String,
  status: String,
  date: String,
};

const Transaction = mongoose.model("Transaction", transactionsSchema);

module.exports = Transaction;
