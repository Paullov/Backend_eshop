const express = require("express");
const router = express.Router();
const { Order } = require("../models/order");
const { OrderItem } = require("../models/orderItem");

// get order list
router.get(`/`, async (req, res) => {
  const orderList = await Order.find()
    .populate("user", "name email")
    .sort({ dateOrdered: -1 });
  if (!orderList) res.status(500).json({ success: false });
  res.send(orderList);
});

//get order by id
router.get(`/:id`, async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate("user", "name email")
    .populate("orderItems")
    .populate({
      path: "orderItems",
      populate: { path: "product", populate: "category" },
    });

  if (!order) res.status(500).json({ success: false });
  res.send(order);
});

//get the total sale//
router.get(`/get/totalsales`, async (req, res) => {
  const totalSales = await Order.aggregate([
    { $group: { _id: null, totalSales: { $sum: "$totalPrice" } } },
  ]).exec();
  if (!totalSales) res.status(400).send("totalSales cannot be generated");
  res.status(200).send({
    totalsales: totalSales.pop().totalSales,
  });
});
// get  orders count
router.get(`/get/count`, async (req, res) => {
  const ordersCount = await Order.countDocuments();
  if (!ordersCount) res.status(500).json({ success: false });
  res.status(200).send({ ordersCount: ordersCount });
});

// get  orders history for user
router.get(`/get/usersorders/:id`, async (req, res) => {
  const orders = await Order.find({ user: req.params.id }).populate({
    path: "orderItems",
    populate: "product",
  });
  if (!orders) res.status(500).json({ success: false });
  res.status(200).send(orders);
});

//post one order //
router.post(`/`, async (req, res) => {
  // get orderItemss
  const orderItemIds = Promise.all(
    req.body.orderItems.map(async (item) => {
      let newOrderItem = new OrderItem({
        product: item.product,
        quantity: item.quantity,
      });
      newOrderItem = await newOrderItem.save();

      return newOrderItem._id;
    })
  );

  const resolvedOrderItemIds = await orderItemIds;
  // get total price
  const totalPriceList = await Promise.all(
    resolvedOrderItemIds.map(async (itemId) => {
      const orderItem = await OrderItem.findById(itemId).populate("product");
      const orderItemPrice = orderItem.product.price;
      return orderItemPrice * orderItem.quantity;
    })
  );

  const totalPrice = totalPriceList.reduce((a, b) => a + b, 0);

  let order = new Order({
    orderItems: resolvedOrderItemIds,
    shippingAddress1: req.body.shippingAddress1,
    shippingAddress2: req.body.shippingAddress2,
    city: req.body.city,
    zip: req.body.zip,
    country: req.body.country,
    phone: req.body.phone,
    status: req.body.status,
    totalPrice: totalPrice,
    user: req.body.user,
  });

  order = await order.save();
  if (!order) return res.status(404).send("the order cannot be created ");
  res.status(200).send(order);
});

//update order status//
router.put(`/:id`, async (req, res) => {
  const order = await Order.findByIdAndUpdate(
    req.params.id,
    {
      status: req.body.status,
    },
    { new: true }
  );
  if (!order) return res.status(404).send("the order cannot be updated ");
  res.send(order);
});

//delete one order by id//
router.delete(`/:id`, async (req, res) => {
  //delete order
  Order.findOneAndDelete({ _id: req.params.id })
    .then(async (order) => {
      if (order) {
        await order.orderItems.forEach(async (item) => {
          await OrderItem.findOneAndDelete({ _id: item._id });
        });
        return res
          .status(200)
          .json({ success: true, message: "the order is deleted!" });
      } else
        return res
          .status(404)
          .json({ success: false, message: "order is not found" });
    })
    .catch((err) => {
      return res.status(400).json({ success: false, error: err });
    });
  //delete orderItem
});

module.exports = router;
