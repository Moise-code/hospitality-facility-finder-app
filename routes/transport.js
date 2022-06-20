const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const router = express.Router();
const auth = require("../middleware/auth");
const { randomNumber } = require("../helpers");

const Transportation = require("../model/transportation");
const Orders = require("../model/orders");
const Booking = require("../model/booking");
const Users = require("../model/users");
const Facility = require("../model/facility");

router.post("/book/", auth, async (req, res) => {
  const { km, departureTime, transactionId, driverLanguage, pt, type, amount } =
    req.body;

  //validate current transaction
  try {
    let parentTransction = null;
    const transportationManagers = await Users.find({ role: "transport" });
    if (type === "orders") {
      parentTransction = await Orders.findOne({
        _id: pt,
        customerId: req.user.user_id,
      });
    } else {
      parentTransction = await Booking.findOne({
        _id: pt,
        customerId: req.user.user_id,
      });
    }
    if (transportationManagers) {
      if (parentTransction) {
        let date =
          type === "orders"
            ? parentTransction.pickupDate
            : parentTransction.checkinDate;
        let tx = await Transportation.create({
          km: km,
          departureTime: departureTime,
          departureDate: date,
          transactionId: transactionId,
          driverLanguage: driverLanguage,
          paymentId: randomNumber(),
          status: "paid",
          amountPaid: amount,
          amountToBePaid: km * 1500,
          parentTransactionId: parentTransction._id,
          transportationManagerId: transportationManagers[0]._id,
          managerId: parentTransction.managerId,
          customerId: req.user.user_id,
        });
        return res
          .status(200)
          .send({ msg: "You have booked taxi successffuly", result: tx });
      } else {
        return res.status(400).send({ msg: "Invalid parent transaction ID" });
      }
    } else {
      return res.status(400).send({
        msg: "Dear user, we can't find any transportation service registered, contact admin for inconsistency.",
      });
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

// router.get("/master/", auth, (req, res) => {
//   Transportation.aggregate(
//     [
//       {
//         $lookup: {
//           from: "facilities",
//           localField: "managerId",
//           foreignField: "managerId",
//           as: "facility",
//         },
//       },
//     ],
//     (err, result) => {
//       if (err) {
//         return res.status(400).send(err);
//       } else {
//         return res.status(200).send({ result });
//       }
//     }
//   );
// });

router.get("/master/", auth, async (req, res) => {
  try {
    const result = [];
    const trans = await Transportation.find({});
    for (let i = 0; i < trans.length; i++) {
      const facility = await Facility.find({
        managerId: trans[i].managerId,
      });
      const customer = await Users.find({ _id: trans[i].customerId });
      result.push({ ...trans[i]._doc, facility, customer });
    }
    return res.status(200).send({ result });
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

router.get("/manager/", auth, async (req, res) => {
  try {
    const result = [];
    const trans = await Transportation.find({});
    for (let i = 0; i < trans.length; i++) {
      const facility = await Facility.find({
        managerId: trans[i].managerId,
      });
      const customer = await Users.find({ _id: trans[i].customerId });
      result.push({ ...trans[i]._doc, facility, customer });
    }
    return res.status(200).send({ result });
  } catch (error) {
    return res.status(400).send(error.message);
  }
});

router.get("/print/:id", auth, async (req, res) => {
  try {
    const id = req.params["id"];
    const tx = await Transportation.findOne({ _id: id });
    if (tx) {
      return res.status(200).send({ result: tx });
    } else {
      return res.status(200).send({ result: {} });
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.get("/find/", auth, async (req, res) => {
  try {
    const result = [];
    const transport = await Transportation.find({ status: "paid" });
    if (transport) {
      for (let i = 0; i < transport.length; i++) {
        const customer = await Users.findOne({
          _id: transport[i].customerId,
        });
        const facility = await Facility.findOne({
          managerId: transport[i].managerId,
        });
        let obj = { ...transport[i]._doc };
        obj.customer = customer;
        obj.facility = facility;
        result.push(obj);
      }
    }
    return res.status(200).send({ result });
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

router.post("/update/", auth, (req, res) => {
  const { driverId, id } = req.body;
  Transportation.updateOne(
    { _id: id },
    { driverId: driverId, deliveryStatus: "on the way" },
    (err, result) => {
      if (err) {
        return res.status(400).send({ msg: err.message });
      } else {
        return res.status(200).send({ msg: "driver ID updated!" });
      }
    }
  );
});

router.post("/confirm/", async (req, res) => {
  try {
    const { driverId, paymentId } = req.body;
    const trans = await Transportation.findOne({ driverId, paymentId });
    if (trans) {
      if (trans.deliveryStatus !== "delivered") {
        await Transportation.updateOne(
          { driverId, paymentId },
          { deliveryStatus: "delivered" }
        );
        return res
          .status(200)
          .send({ msg: "Transaction confirmed successful." });
      } else {
        return res.status(400).send({ msg: "Transaction already confirmed." });
      }
    } else {
      return res.status(400).send({ msg: "Invalid information." });
    }
  } catch (error) {
    return res.status(400).send({ msg: error.message });
  }
});

module.exports = router;
