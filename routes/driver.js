const express = require("express");
const router = express.Router();
const passport = require("passport");
const DriverAcc = require("../models/driverModel");

const ensureAuthenticated = require("../utils/driverAuthenticated");

router.get("/driverlogin", (req, res) => {
  if (ensureAuthenticated) {
    res.redirect("/driverdashboard");
  } else {
    res.render("driverLogin");
  }
});

router.get("/driversignin", (req, res) => {
  res.render("driverSignIn");
});

router.get("/driverdashboard", ensureAuthenticated, (req, res) => {
  res.render("driver", {
    currentUser: req.user,
  });
});

router.post("/driversignin", (req, res) => {
  DriverAcc.register(
    { username: req.body.username, rating: [], avgRating: 0 },
    req.body.password,
    function (err, user) {
      if (err) {
        console.log(err);
        // res.redirect("/driverlogin");
      } else {
        passport.authenticate("driverLocal")(req, res, function () {
          res.redirect("/driverdashboard");
        });
      }
    }
  );
});

router.post("/driverlogin", function (req, res) {
  const driver = new DriverAcc({
    username: req.body.username,
    password: req.body.password,
  });

  req.login(driver, function (err) {
    if (err) {
      console.log(err);
    } else {
      passport.authenticate("driverLocal")(req, res, function () {
        res.redirect("/driverdashboard");
      });
    }
  });
});

router.get("/updatestatus/:status", ensureAuthenticated, function (req, res) {
  if (ensureAuthenticated) {
    status = req.params.status;
    const id = req.user._id;

    if (status === "available") {
      DriverAcc.findByIdAndUpdate(id, { status: true }, function (err) {
        DriverAcc.findById(id, function (err, doc) {
          req.logIn(doc, function (err1) {
            if (err1) {
              console.log("Error : " + err1);
            } else {
              res.render("driver", {
                currentUser: req.user,
              });
            }
          });
        });
      });
    } else {
      DriverAcc.findByIdAndUpdate(id, { status: false }, function (err) {
        DriverAcc.findById(id, function (err, doc) {
          req.logIn(doc, function (err1) {
            if (err1) {
              console.log("Error : " + err1);
            } else {
              res.render("driver", {
                currentUser: req.user,
              });
            }
          });
        });
      });
    }
  }
});

router.post("/drivereditprofile", ensureAuthenticated, function (req, res) {
  ensureAuthenticated;
  const id = req.user._id;

  let params = {};
  for (let prop in req.body) if (req.body[prop]) params[prop] = req.body[prop];

  DriverAcc.findByIdAndUpdate(id, params, function (err) {
    DriverAcc.findById(id, function (err, doc) {
      req.logIn(doc, function (err1) {
        if (err1) {
          console.log("Error : " + err1);
        } else {
          res.render("driver", {
            currentUser: req.user,
          });
        }
      });
    });
  });
});

router.post("/setrating/:id", ensureAuthenticated, function (req, res) {
  ensureAuthenticated;

  const driverId = req.params.id;
  const accId = req.user._id;
  const rating = req.body.rating;

  DriverAcc.findById(driverId, function (err, driver) {
    function addNewRating() {
      let newRating = {
        id: accId,
        rating: rating,
      };
      driver.rating.push(newRating);
    }

    function calcAvg(total) {
      let avg = total / driver.rating.length;
      return avg;
    }

    let accFound = false;

    let currentAvgRating = 0;

    for (let index = 0; index < driver.rating.length; index++) {
      const currentDriverRating = driver.rating[index];

      currentAvgRating += currentDriverRating.rating;

      if (currentDriverRating.id === accId) {
        console.log("Found Rating");
        currentDriverRating.rating = rating;
        accFound = true;
      }
    }

    driver.avgRating = calcAvg(currentAvgRating);

    if (accFound === false) {
      addNewRating();
    }

    driver.save(function (err) {
      console.log(err);
      if (!err) {
        res.redirect(`/search/${driverId}`);
      }
    });
  });
});

module.exports = router;
