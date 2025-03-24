const Order = require("../../models/orderdetails");
const Returns = require("../../models/productreturn");
const mongoose = require("mongoose");
const { ObjectId } = require("mongoose").Types;

const loadOrdermanage = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 6;
    const skip = (page - 1) * limit;

    const totalOrders = await Order.countDocuments();
    const totalPages = Math.ceil(totalOrders / limit);

    const returns = await Returns.find();
    console.log("returns", returns);

    const orders = await Order.find()
      .skip(skip)
      .limit(limit)
      .populate("customerId")
      .populate("items.productId")
      .populate("coupon")
      .sort({ createdAt: -1 });

    res.status(200).render("admin/ordermanage", {
      orders,
      returns,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching orders");
  }
};

const OrderManage = async (req, res) => {
  try {
    const { status } = req.body;
    const orderId = req.params.id;
    await Order.findByIdAndUpdate(orderId, { status }, { new: true });
    res.status(200).redirect("/admin/ordermanage");
  } catch (error) {
    console.error("Error updating order status:", error);
    res.status(500).send("Server Error");
  }
};

const orderView = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("coupon");

    if (!order) return res.status(404).send("Order not found");

    const item = order.items.find(
      (i) => i.productId._id.toString() === productId
    );
    if (!item) return res.status(404).send("Product not found in order");

    res.status(200).render("admin/orderview", { order, item });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error fetching order details");
  }
};

const statusUpdate = async (req, res) => {
  try {
    const { orderId, productId } = req.params;
    const { status, paymentStatus } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(400).send("Invalid ID format");
    }

    const order = await Order.findById(orderId);
    if (!order) return res.status(404).send("Order not found");

    const item = order.items.find((i) => i._id.equals(productId));
    if (!item) return res.status(404).send("Product not found in order");

    item.shippingDetails.status = status;
    item.paymentStatus = paymentStatus;

    await order.save();

    console.log("After update:", item);

    res.status(200).redirect("/admin/ordermanage");
  } catch (error) {
    console.error("Error updating status:", error);
    res.status(500).send("Error updating product status");
  }
};

module.exports = {
  loadOrdermanage,
  OrderManage,
  orderView,
  statusUpdate,
};
