const { Int32 } = require("bson");
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const car = new Schema(
  {
    name: {
      type: String,
      required: true,
    },

    img: {
      type: String,
      required: true,
    },

    specs: {
      type: String,
      required: true,
    },

    rent: {
      type: Number,
      required: true,
    },

    notAvailable: {
      type: [String],
    },

    addedBy: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }
);

const Car = mongoose.model("car", car);

module.exports = Car;
