const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const booking = new Schema(
  {
    car: {
      type: String,
      required: true,
    },
    user: {
      type: String,
      required: true,
    },
    showroom: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    status: {
      type: Boolean,
      required: true,
    },
    dates: {
      type: [String],
      required: true,
    },
    totalRent: {
      type: String,
      required: true,
    },
    ends: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const Booking = mongoose.model("booking", booking);

module.exports = Booking;
