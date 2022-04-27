const User = require("../models/user");
const Showroom = require("../models/showRoom");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const Car = require("../models/car");
const nodemailer = require("nodemailer");
const firebase = require("./firebaseAdmin");

var bucket = firebase.admin.storage().bucket();

const register = (req, res) => {
  if (
    !req.body.email ||
    !req.body.name ||
    !req.body.phone ||
    !req.body.password
  ) {
    res.json({
      error: "provide all details",
    });
    return;
  }
  User.findOne({ email: req.body.email }).then((user) => {
    if (user) {
      res.json({
        error: "you already have an account",
      });
    } else {
      bcrypt.hash(req.body.password, 10, function (err, hashedPass) {
        if (err) {
          res.json({
            error: "error",
          });
        }

        let user = new User({
          email: req.body.email,
          name: req.body.name,
          phone: req.body.phone,
          password: hashedPass,
          verified: false,
        });

        user
          .save()
          .then((user) => {
            let token = jwt.sign(
              { email: user.email, name: user.name, id: user.id },
              "key"
            );
            //    res.cookie('token',token,{httpOnly:true,maxAge: 3*24*60*60*1000});
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
              to: user.email,
              subject: "Carwaan | Verify account ",
              html: `<p>
              <div style="font-size: large;font-weight: bold;">Confirmation:</div>
              <div style="font-size: medium;">verify your carwaan account.</div>
              <br />
              <a href="https://carwaan.herokuapp.com/auth/verify?token=${token}"
              style="background-color: black; color: white; padding: 7px 14px; text-decoration: none;font-size: large;"
                >Confirm</a>
              </p>`,
              // text:
              //   // "http://192.168.0.197:3000/auth/verify?token=" +
              //   "verify your carwaan account by clicking this link: https://carwaan.herokuapp.com/auth/verify?token=" +
              //   token,
            };

            transporter.sendMail(mailOptions, function (error, info) {
              if (error) {
                res.json({
                  error: "User not Added, Try again!",
                });
              } else {
                res.json({
                  success: "User Added",
                });
              }
            });
          })
          .catch((error) => {
            res.json({
              error: "User not Added",
            });
          });
      });
    }
  });
};

const registerShowroom = (req, res) => {
  if (!req.file) {
    res.json({
      error: "Error uploading image.",
    });
  }

  if (
    !req.body.email ||
    !req.body.name ||
    !req.body.phone ||
    !req.body.location ||
    !req.body.cnic ||
    !req.body.password
  ) {
    res.json({
      error: "provide all details",
    });
    return;
  }
  Showroom.findOne({ email: req.body.email }).then((showroom) => {
    if (showroom) {
      res.json({
        error: "you already have an account",
      });
    } else {
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
        let url =
          "https://storage.googleapis.com/" +
          bucket.name +
          "/" +
          fileUpload.name;

        bcrypt.hash(req.body.password, 10, function (err, hashedPass) {
          if (err) {
            res.json({
              error: "error",
            });
          }

          let showroom = new Showroom({
            email: req.body.email,
            name: req.body.name,
            phone: req.body.phone,
            img: url,
            location: req.body.location,
            cnic: req.body.cnic,
            password: hashedPass,
            verified: false,
            ratings: 5,
          });

          showroom
            .save()
            .then((showroom) => {
              res.json({
                success: "wait for verification.",
              });
            })
            .catch((error) => {
              res.json({
                error: "Showroom not Added",
              });
            });
        });
      });

      blobStream.end(req.file.buffer);
    }
  });
};

const login = (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  User.findOne({ email: email }).then((user) => {
    if (user) {
      if (!user.verified) {
        res.json({
          error: "Your account is not verified",
        });
      } else {
        bcrypt.compare(password, user.password, function (err, result) {
          if (err) {
            res.json({
              error: "Incorrect Password",
            });
          }
          if (result) {
            let token = jwt.sign(
              { email: user.email, name: user.name, id: user.id },
              "key"
            );

            res.json({
              success: "Login Successful",
              token: token,
            });
          } else {
            res.json({
              error: "Incorrect Password",
            });
          }
        });
      }
    } else {
      res.json({
        error: "user not found",
      });
    }
  });
};

const loginShowroom = (req, res) => {
  var email = req.body.email;
  var password = req.body.password;

  Showroom.findOne({ email: email }).then((showroom) => {
    if (showroom) {
      if (!showroom.verified) {
        res.json({
          error: "Your account is not verified",
        });
      } else {
        bcrypt.compare(password, showroom.password, function (err, result) {
          if (err) {
            res.json({
              error: "Incorrect Password",
            });
          }
          if (result) {
            let token = jwt.sign(
              { email: showroom.email, name: showroom.name, id: showroom.id },
              "key"
            );

            res.json({
              success: "Login Successful",
              token: token,
            });
          } else {
            res.json({
              error: "Incorrect Password",
            });
          }
        });
      }
    } else {
      res.json({
        error: "Showroom not found",
      });
    }
  });
};

const verify = (req, res, next) => {
  let token = req.query.token;

  jwt.verify(token, "key", (error, result) => {
    if (error) {
      res.send("verification failed");
    } else {
      let email = result.email;
      User.findOne({ email: email }).then((user) => {
        user.verified = true;
        user
          .save()
          .then((user) => {
            res.send("verification successful.");
          })
          .catch((error) => {
            res.send("verification failed.");
          });
      });
    }
  });
};

const verifyShowroom = (req, res, next) => {
  let token = req.body.pass;
  let email = req.body.email;

  if (token == "admin123") {
    Showroom.findOne({ email: email }).then((showroom) => {
      showroom.verified = true;
      showroom
        .save()
        .then((showroom_) => {
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
            to: showroom_.email,
            subject: "Carwaan | Verify account ",
            html: `<p>
              <div style="font-size: large;font-weight: bold;">Confirmation:</div>
              <div style="font-size: medium;">Dear Customer, your carwaan partner account is verified.</div>
              <br />
              </p>`,
            // text:
            //   // "http://192.168.0.197:3000/auth/verify?token=" +
            //   "verify your carwaan partner account by clicking this link: https://carwaan.herokuapp.com/auth/verifyshowroom?token=" +
            //   token,
          };

          transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
              res.json({
                error: "Showroom not Added, Try again!",
              });
            } else {
              res.json({
                success: "Showroom Added",
              });
            }
          });

          res.send("verification successful.");
        })
        .catch((error) => {
          res.send("verification failed.");
        });
    });
  } else {
    res.send("access denied");
  }
};

function check_auth_by_token(token) {
  let email = "error";
  let name = "error";

  if (token) {
    jwt.verify(token, "key", (error, result) => {
      if (error) {
      } else {
        email = result.email;
        name = result.name;
      }
    });
  } else {
    // res.json({
    //   error: "unauthorized",
    // });
    // return;
  }

  return email;
}

const check_auth = (req, res, next) => {
  const token = req.body.token;

  if (token) {
    jwt.verify(token, "key", (error, result) => {
      if (error) {
        res.json({
          message: "not login",
        });
      } else {
        req.body.id = result.id;
        next();
      }
    });
  } else {
    res.json({
      message: "not login",
    });
  }
};

const get_info = (req, res, next) => {
  const token = req.body.token;

  if (token) {
    jwt.verify(token, "key", (error, result) => {
      if (error) {
        res.json({
          message: "NULL",
        });
      } else {
        User.findById(result.id)
          .then((reslt) => {
            res.json(reslt);
          })
          .catch((error) => {
            res.json({
              error: "error",
            });
          });
      }
    });
  } else {
    res.json({
      message: "NULL",
    });
  }
};

const get_all_posts = (req, res, next) => {
  const token = req.body.token;

  if (token) {
    jwt.verify(token, "key", (error, result) => {
      if (error) {
        res.json({
          message: "NULL",
        });
      } else {
        User.findById(result.id)
          .then((reslt) => {
            Post.find({})
              .then((result) => {
                // console.log(result);

                res.send(result);
              })
              .catch((error) => {
                res.send("Error");
              });
          })
          .catch((error) => {
            res.send("Error");
          });
      }
    });
  }
};

const get_all_my_posts = (req, res, next) => {
  const token = req.body.token;

  if (token) {
    jwt.verify(token, "key", (error, result) => {
      if (error) {
        res.json({
          message: "NULL",
        });
      } else {
        User.findById(result.id)
          .then((reslt) => {
            Post.find({ postby: reslt.username })
              .then((result) => {
                // console.log(result);

                res.send(result);
              })
              .catch((error) => {
                res.send("Error");
              });
          })
          .catch((error) => {
            res.send("Error");
          });
      }
    });
  }
};

const change_profile = (req, res, next) => {
  let id,
    username = check_auth_by_token(req.body.token);

  User.find({ username: username })
    .then((user) => {
      user[0].avatar =
        req.body.avatar != "" &&
        parseInt(req.body.avatar) <= 5 &&
        parseInt(req.body.avatar) >= 1
          ? req.body.avatar
          : 1;
      user[0]
        .save()
        .then((user) => {
          res.json(user);
        })
        .catch((error) => {
          res.send("Error");
        });
    })
    .catch((error) => {
      res.send("Error");
    });
};

module.exports = {
  register,
  registerShowroom,
  login,
  loginShowroom,
  check_auth,
  get_info,
  check_auth_by_token,
  change_profile,
  get_all_posts,
  get_all_my_posts,
  verify,
  verifyShowroom,
};
