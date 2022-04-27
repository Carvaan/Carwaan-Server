const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const showroom = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    img: {
      type: String,
      required: true,
    },

    phone: {
      type: String,
      required: true,
    },

    password: {
      type: String,
      required: true,
    },

    location: {
      type: String,
      required: true,
    },

    cnic: {
      type: String,
      required: true,
    },

    ratings: {
      type: Number,
    },

    requests: {
      type: String,
    },

    verified: {
      type: Boolean,
      required: true,
    },
  },
  { timestamps: true }
);

const Showroom = mongoose.model("showroom", showroom);

module.exports = Showroom;
