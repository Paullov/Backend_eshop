const express = require("express");
const router = express.Router();
const { User } = require("../models/user");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

//get all users//
router.get(`/`, async (req, res) => {
  const userList = await User.find().select("-passwordHash");
  if (!userList) res.status(500).json({ success: false });
  res.send(userList);
});

// get  users count
router.get(`/get/count`, async (req, res) => {
  const userCount = await User.countDocuments();
  if (!userCount) res.status(500).json({ success: false });
  res.status(200).send({ userCount: userCount });
});

//get a users//
router.get(`/:id`, async (req, res) => {
  const user = await User.findById(req.params.id).select("-passwordHash");
  if (!user)
    res.status(404).json({
      success: false,
      message: "the user with given id is not found",
    });
  res.status(200).send(user);
});

//post one user by admin //
router.post(`/`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    apartment: req.body.apartment,
    zip: req.body.zip,
    street: req.body.street,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) return res.status(404).send("the user cannot be created ");
  res.status(200).send(user);
});

//post one use by user in register //
router.post(`/register`, async (req, res) => {
  let user = new User({
    name: req.body.name,
    email: req.body.email,
    passwordHash: bcrypt.hashSync(req.body.password, 10),
    phone: req.body.phone,
    isAdmin: req.body.isAdmin,
    apartment: req.body.apartment,
    zip: req.body.zip,
    street: req.body.street,
    city: req.body.city,
    country: req.body.country,
  });

  user = await user.save();
  if (!user) return res.status(404).send("the user cannot be created ");
  res.status(200).send(user);
});

//login
router.post(`/login`, async (req, res) => {
  try {
    const secret = process.env.secret;
    const user = await User.findOne({ email: req.body.email });
    if (!user) res.status(400).send("user is not found");
    if (user && bcrypt.compareSync(req.body.password, user.passwordHash)) {
      const token = jwt.sign(
        { userId: user.id, isAdmin: user.isAdmin },
        secret,
        { expiresIn: "1d" }
      );
      res.status(200).send({ email: user.email, token: token });
    } else {
      res.status(500).send("password is wrong");
    }
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

//delete one user by id//
router.delete(`/:id`, async (req, res) => {
  User.findOneAndDelete({ _id: req.params.id })
    .then((user) => {
      if (user) {
        return res
          .status(200)
          .json({ success: true, message: "the user is deleted!" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "user is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
});

module.exports = router;
