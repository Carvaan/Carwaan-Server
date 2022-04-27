const Car = require("../models/car");
const User = require("../models/user");
const Booking = require("../models/booking");
const Showroom = require("../models/showRoom");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

const authcontroller = require("./auth_controller");

const firebase = require("./firebaseAdmin");

var bucket = firebase.admin.storage().bucket();

const addCar = (req, res, next) => {
  // console.log(req.file);
  let email = authcontroller.check_auth_by_token(req.body.token);

  if (!req.file) {
    res.json({
      error: "Error uploading image.",
    });
  }

  let myfile = req.file.originalname.split(".");
  let newFileName = Date.now() + "." + myfile[myfile.length - 1];

  let fileUpload = bucket.file(newFileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobStream.on("error", (error) => {
    res.json({
      error: "Error uploading image" + error,
    });
  });

  blobStream.on("finish", () => {
    // The public URL can be used to directly access the file via HTTP.
    let url =
      "https://storage.googleapis.com/" + bucket.name + "/" + fileUpload.name;
    // resolve(url);

    if (email != "error") {
      let name = req.body.name;
      let specs = req.body.specs;
      let rent = req.body.rent;
      let img = url;
      let addedBy = email;

      let car = Car({
        name,
        specs,
        rent,
        img,
        addedBy,
      });

      car
        .save()
        .then((car) => {
          res.json({
            success: car,
          });
        })
        .catch((error) => {
          res.json({
            error: "Error Adding Car" + error,
          });
        });
    } else {
      res.json({
        error: "Error Adding Car" + error,
      });
    }
  });

  blobStream.end(req.file.buffer);
};

const editCar = (req, res, next) => {
  // console.log(req.file);
  let email = authcontroller.check_auth_by_token(req.body.token);
  let carId = req.body.carId;

  if (!req.file) {
    res.json({
      error: "Error uploading image.",
    });
  }

  let myfile = req.file.originalname.split(".");
  let newFileName = Date.now() + "." + myfile[myfile.length - 1];

  let fileUpload = bucket.file(newFileName);

  const blobStream = fileUpload.createWriteStream({
    metadata: {
      contentType: req.file.mimetype,
    },
  });

  blobStream.on("error", (error) => {
    res.json({
      error: "Error uploading image" + error,
    });
  });

  blobStream.on("finish", async () => {
    // The public URL can be used to directly access the file via HTTP.
    let url =
      "https://storage.googleapis.com/" + bucket.name + "/" + fileUpload.name;
    // resolve(url);

    if (email != "error") {
      let name = req.body.name;
      let specs = req.body.specs;
      let rent = req.body.rent;
      let img = url;
      let addedBy = email;

      console.log(carId);

      let car = await Car.findById(carId);

      if (!car) {
        res.json({
          error: "Error Editing Car",
        });
      }

      car.name = name;
      car.specs = specs;
      car.rent = rent;
      car.img = img;

      car
        .save()
        .then((car) => {
          res.json({
            success: car,
          });
        })
        .catch((error) => {
          res.json({
            error: "Error Editing Car" + error,
          });
        });
    } else {
      res.json({
        error: "Error Editing Car" + error,
      });
    }
  });

  blobStream.end(req.file.buffer);
};

const deleteCar = (req, res, next) => {
  let id = req.body.carId;
  let email = authcontroller.check_auth_by_token(req.body.token);

  Car.findById(id.toString())
    .then((car) => {
      if (car.addedBy == email) {
        Car.findByIdAndDelete(id)
          .then((car) => {
            res.json({
              success: car,
            });
          })
          .catch((err) => {
            res.json({
              error: "Error Deleting Car",
            });
          });
      } else {
        res.json({
          error: "Error Deleting Car",
        });
      }
    })
    .catch((error) => {
      res.json({
        error: "Error Deleting Car",
      });
    });
};

const bookACar = async (req, res) => {
  console.log("aaa", req.body);

  try {
    let carId = req.body.carId;
    let email = authcontroller.check_auth_by_token(req.body.token);
    let day = req.body.day;
    let month = req.body.month;
    let year = req.body.year;
    let noOfDays = parseInt(req.body.difference);
    let available = true;
    let ends = parseInt(req.body.ends);

    let car = await Car.findById(carId);

    let date = new Date(year, parseInt(month) + 1, day);

    let dateArr = [];

    var dateTest = new Date();

    for (let i = 0; i <= noOfDays; i++) {
      dateTest.setDate(date.getDate() + i);
      dateArr.push(dateTest.toDateString());
    }

    car?.notAvailable?.forEach((date) => {
      if (dateArr.includes(date)) {
        available = false;
        res.json({
          error: "Car is already booked on " + date,
        });
        return;
      }
    });

    if (carId && email && car && available) {
      let booking = new Booking({
        car: carId,
        user: email,
        showroom: car.addedBy,
        address: req.body.address,
        status: false,
        dates: dateArr,
        totalRent: (car.rent * dateArr.length).toString(),
        ends: ends,
      });
      booking
        .save()
        .then((booking) => {
          let token = jwt.sign({ id: booking.id, email: email }, "key");

          var transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
              type: "OAuth2",
              user: "carwaan99@gmail.com",
              clientId: process.env.CLIENT_ID,
              clientSecret: process.env.CLIENT_SECRET,
              refreshToken: process.env.REFRESH_TOKEN,
            },
          });

          var mailOptions = {
            from: "carwaan99@gmail.com",
            to: car.addedBy,
            subject: "Carwaan | Booking Confirmation ",
            html: `<p>
          <div style="font-size: large;font-weight: bold;">Booking Confirmation:</div>
          <div style="font-size: medium;">${email} has booked a car, please confirm the booking.</div><br/>
          <div style="font-size: medium;">Booking Details:</div><br/>
          <div style="font-size: medium;">-Adress: ${
            booking?.address
          }</div><br/>
          <div style="font-size: medium;">-Dates: ${booking?.dates[0]} - ${
              booking?.dates[booking?.dates?.length - 1]
            }</div><br/>
          <div style="font-size: medium;">-Total Rent: ${
            booking?.totalRent
          }</div><br/>
          <br />
          <a href="https://carwaan.herokuapp.com/car/verifybooking?token=${token}?status=true" style="background-color: black; color: white; padding: 7px 14px; text-decoration: none; font-size: large;"
            >Confirm</a> &nbsp;
            <a href="https://carwaan.herokuapp.com/car/verifybooking?token=${token}?status=false" style="background-color: black; color: white; padding: 7px 14px; text-decoration: none; font-size: large;"
            >Reject</a>
          </p>`,
            // text:
            //   // "http://192.168.0.197:3000/auth/verify?token=" +
            //   `${email} has booked a car if you wan't to accept the booking click here : https://carwaan.herokuapp.com/car/verifybooking?token=${token}?status=true \n\n\n` +
            //   ` If you wan't to reject the booking click here : https://carwaan.herokuapp.com/car/verifybooking?token=${token}?status=false`,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.json({
                error: "booking unsuccessfull" + error,
              });
            } else {
              res.json({
                success: "booking successful",
              });
            }
          });
        })
        .catch((error) => {
          res.json({
            error: "booking unsuccessfull" + error,
          });
        });
    } else {
      res.json({
        error: "booking unsuccessfull" + error,
      });
    }
  } catch (e) {
    console.log(e);
  }
};

const confirmBooking = async (req, res) => {
  let token = req.query.token.split("?")[0];
  let status = req.query.token.split("=")[1];

  jwt.verify(token, "key", (error, result) => {
    if (error) {
      res.send("verification failed");
    } else {
      let id = result.id;
      let email = result.email;
      Booking.findById(id).then(async (booking) => {
        if (status == "true" && booking) {
          let car = await Car.findById(booking.car);

          let newDates = car.notAvailable;
          if (newDates) {
            newDates = newDates.concat(booking.dates);
            console.log(newDates);
          } else {
            newDates = booking.dates;
            console.log(newDates);
          }

          car.notAvailable = newDates;

          await car.save();

          booking.status = true;
          booking
            .save()
            .then((booking) => {
              var mailOptions = {
                from: "carwaan99@gmail.com",
                to: email,
                subject: "Carwaan | Booking Confirmation",
                html: `<p>
          <div style="font-size: large;font-weight: bold;">Booking Confirmation:</div>
          <div style="font-size: medium;">Dear Customer, your booking is confirm.</div>
          <br />
          <a href="https://carwaanadmin.web.app/ratings/${booking?._id}" style="background-color: black; color: white; padding: 7px 14px; text-decoration: none; font-size: large;"
            >Rate this Booking.</a> &nbsp;
          </p>`,
              };

              var transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  type: "OAuth2",
                  user: "carwaan99@gmail.com",
                  clientId: process.env.CLIENT_ID,
                  clientSecret: process.env.CLIENT_SECRET,
                  refreshToken: process.env.REFRESH_TOKEN,
                },
              });

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  res.json({
                    error: "error",
                  });
                } else {
                  res.send("booking confirm");
                }
              });
            })
            .catch((error) => {
              res.send("confirmation failed." + error);
            });
        } else {
          booking.status = false;
          booking
            .save()
            .then((user) => {
              var mailOptions = {
                from: "carwaan99@gmail.com",
                to: email,
                subject: "Carwaan | Booking Rejected",
                text: `your booking has been rejected.`,
              };

              var transporter = nodemailer.createTransport({
                service: "gmail",
                auth: {
                  type: "OAuth2",
                  user: "carwaan99@gmail.com",
                  clientId: process.env.CLIENT_ID,
                  clientSecret: process.env.CLIENT_SECRET,
                  refreshToken: process.env.REFRESH_TOKEN,
                },
              });

              transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                  res.json({
                    error: "error",
                  });
                } else {
                  res.send("booking rejected");
                }
              });
            })
            .catch((error) => {
              res.send("confirmation failed." + error);
            });
        }
      });
    }
  });
};

const getMyBookingUser = async (req, res) => {
  let email = authcontroller.check_auth_by_token(req.body.token);

  let bookings = await Booking.find({ user: email, status: true });

  let bookingsDetails = [];
  bookings.forEach((booking) => {
    bookingsDetails.push(Car.findById(booking.car));
  });

  Promise.all(bookingsDetails)
    .then((values) => {
      let userDetails = [];

      bookings.forEach((booking) => {
        userDetails.push(User.findOne({ email: booking.user }));
      });

      for (let i = 0; i < bookings.length; i++) {
        bookings[i] = {
          ...bookings[i],
          carDetails: values[i],
        };
      }

      Promise.all(userDetails)
        .then((values) => {
          for (let i = 0; i < bookings.length; i++) {
            bookings[i] = {
              ...bookings[i],
              userDetails: values[i],
            };
          }

          res.json({
            success: bookings,
          });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            error: "some error occured",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        error: "some error occured",
      });
    });
};

const getMyBookingShowroom = async (req, res) => {
  let email = authcontroller.check_auth_by_token(req.body.token);

  let bookings = await Booking.find({ showroom: email, status: true });
  let bookingsDetails = [];
  bookings.forEach((booking) => {
    bookingsDetails.push(Car.findById(booking.car));
  });

  Promise.all(bookingsDetails)
    .then((values) => {
      let userDetails = [];

      bookings.forEach((booking) => {
        userDetails.push(User.findOne({ email: booking.user }));
      });

      for (let i = 0; i < bookings.length; i++) {
        bookings[i] = {
          ...bookings[i],
          carDetails: values[i],
        };
      }

      Promise.all(userDetails)
        .then((values) => {
          for (let i = 0; i < bookings.length; i++) {
            bookings[i] = {
              ...bookings[i],
              userDetails: values[i],
            };
          }

          res.json({
            success: bookings,
          });
        })
        .catch((error) => {
          console.log(error);
          res.json({
            error: "some error occured",
          });
        });
    })
    .catch((error) => {
      console.log(error);
      res.json({
        error: "some error occured",
      });
    });
};

const getAllShowrooms = async (req, res) => {
  let showrooms = await Showroom.find({ verified: true });

  res.json({
    success: showrooms,
  });
};

const getAllShowroomsNotVerified = async (req, res) => {
  let showrooms = await Showroom.find({ verified: false });

  res.json({
    success: showrooms,
  });
};

const getShowroomCars = async (req, res) => {
  let showRoomEmail = req.body.showRoomEmail;
  let cars = await Car.find({ addedBy: showRoomEmail });

  res.json({
    success: cars,
  });
};

const getAllCars = async (req, res) => {
  let cars = await Car.find({});

  res.json({
    success: cars,
  });
};

const getShowroomNo = async (req, res) => {
  let showRoomEmail = req.body.showRoomEmail;
  let showroom = await Showroom.findOne({ email: showRoomEmail });
  console.log(showroom);
  res.send(showroom ? showroom.phone : "");
};

const getShowroomName = async (req, res) => {
  let showRoomEmail = req.body.showRoomEmail;
  let showroom = await Showroom.findOne({ email: showRoomEmail });
  res.json({
    success: showroom.name,
  });
};

const getCarDetails = async (req, res) => {
  let id = req.body.carId;

  Car.findById(id)
    .then((car) => {
      res.json({
        success: car,
      });
    })
    .catch((error) => {
      res.json({
        error: error,
      });
    });
};

const rateBooking = async (req, res) => {
  try {
    const bookingId = req.body.bookingId;
    const rating = parseInt(req.body.rating);
    const booking = await Booking.findById(bookingId);
    const showroom = await Showroom.findOne({ email: booking.showroom });
    showroom.ratings = (showroom.ratings + rating) / 2;
    await showroom?.save();
    res.send("Ratings submitted.");
  } catch (e) {
    console.log(e);
    res.json({
      error: e,
    });
  }
};

module.exports = {
  addCar,
  editCar,
  deleteCar,
  bookACar,
  confirmBooking,
  getMyBookingUser,
  getMyBookingShowroom,
  getAllShowrooms,
  getAllShowroomsNotVerified,
  getShowroomCars,
  getShowroomName,
  getCarDetails,
  getShowroomNo,
  rateBooking,
  getAllCars,
};
