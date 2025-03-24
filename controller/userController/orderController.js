const Order = require("../../models/orderdetails");
const Product = require("../../models/productmodel");
const Cart = require("../../models/cartpagemodel");
const userSchema = require("../../models/usermodel");
const Coupon = require("../../models/couponmodel");
const Address = require("../../models/addressmodel");
const payments = require("../../models/paymentmodel");
const Returns = require("../../models/productreturn");
const mongoose = require("mongoose");
const Orders = require("../../models/orderdetails");
const Wallet = require("../../models/walletmodel");
const { orderView } = require("../adminController/orderController");
require("dotenv").config();
const Razorpay = require("razorpay");

const razorpayInstance = new Razorpay({
  key_id: "rzp_test_tiBBaN9rBkAr9r", 
  key_secret: "VCzNc72HUDmdOHK9Va1BkfpE",
});

const buyNow = async (req, res) => {
  try {
    req.session.buyCheck = "buyNow";
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render("user/404");
    }

    const { qty, color } = req.query;
    console.log("=============check", color);

    const email = req.session?.details?.email;
    if (!email) return res.status(401).redirect("/signin");

    const product = await Product.findById({ _id: id });
    const user = await userSchema.findOne({ email });
    if (!user) return res.status(401).redirect("/signin");

    const address = await Address.find({ userId: user._id });

    const quantity = parseFloat(qty) || 1;
    const cartItems = [{ productId: product, quantity }];

    let originalTotal = 0;
    let totalDiscount = 0;
    let totalValue = 0;

    cartItems.forEach((item) => {
      const originalPrice =
        parseFloat(item.productId.price.replace(/,/g, "")) || 0;

      console.log("originalPrice", originalPrice);

      const discountMatch = item.productId.offer
        ? item.productId.offer.match(/\d+/)
        : null;

      console.log("discountMatch", discountMatch);
      const discountPercentage = discountMatch
        ? parseFloat(discountMatch[0])
        : 0;
      console.log("discountPercentage", discountPercentage);
      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;

      console.log("discountedPrice", discountedPrice);

      const itemTotalOriginal = originalPrice * quantity;
      const itemTotalDiscounted = discountedPrice * quantity;
      const discountAmount = itemTotalOriginal - itemTotalDiscounted;

      originalTotal += itemTotalOriginal;
      totalDiscount += discountAmount;
      totalValue += itemTotalDiscounted;
    });
    const wallet = await Wallet.findOne({ userId: user._id });

    console.log("buynow", wallet);

    const message = req.flash("count");

    const availableCoupons = await Coupon.find({});

    res.status(200).render("user/checkout", {
      address,
      product,
      message,
      totalItems: 1,
      originalTotal,
      totalDiscount,
      totalValue,
      user,
      cartItems,
      quantity,
      color,
      availableCoupons,
      wallet,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const loadCheckout = async (req, res) => {
  try {
    const check = req.session?.buyCheck;
    const message = req.flash("count");

    if (!check) return res.status(400).redirect("/");

    const email = req.session?.details?.email;
    if (!email) return res.status(401).redirect("/login");

    const user = await userSchema.findOne({ email });
    if (!user) return res.status(401).redirect("/login");

    const address = await Address.find({ userId: user._id });
    const wallet = await Wallet.findOne({ userId: user._id });

    if (check === "Cart") {
      const cartItems = await Cart.findOne({ userId: user._id }).populate({
        path: "items.productId",
        model: "Product",
      });

      if (!cartItems || cartItems.items.length === 0) {
        return res.status(404).redirect("/cart");
      }

      let color = req.query.color.split(",");
      console.log("Cart Items:", color);

      let originalTotal = 0;
      let totalDiscount = 0;
      let totalValue = 0;

      cartItems.items.forEach((item) => {
        const originalPrice =
          parseFloat(item.productId?.price.replace(/,/g, "")) || 0;
        const discountMatch = item.productId?.offer
          ? item.productId.offer.match(/\d+/)
          : null;
        const discountPercentage = discountMatch
          ? parseFloat(discountMatch[0])
          : 0;
        const discountedPrice = Math.floor(
          originalPrice - (originalPrice * discountPercentage) / 100
        );

        const quantity = Number(item.quantity);
        const itemTotalOriginal = originalPrice * quantity;
        const itemTotalDiscounted = discountedPrice * quantity;
        const discountAmount = itemTotalOriginal - itemTotalDiscounted;

        originalTotal += itemTotalOriginal;
        totalDiscount += discountAmount;
        totalValue += itemTotalDiscounted;
      });

      const availableCoupons = await Coupon.find({});

      res.status(200).render("user/checkout", {
        totalItems: cartItems.items.length,
        cartItems,
        originalTotal,
        totalDiscount,
        totalValue,
        address,
        user,
        message,
        color,
        availableCoupons,
        wallet,
      });
    }
    if (check === "buyNow") {
      const productId = req.session?.productId;
      const qty = req.session?.quantity || 1;
      console.log("buynow2", wallet);
      if (!productId) return res.status(400).redirect("/");

      const product = await Product.findById(productId);
      if (!product) return res.status(404).redirect("/");

      const originalPrice = Math.floor(
        parseFloat(product.price.replace(/,/g, "")) || 0
      );
      const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
      const discountPercentage = Math.floor(
        discountMatch ? parseFloat(discountMatch[0]) : 0
      );
      const discountedPrice = Math.floor(
        originalPrice - (originalPrice * discountPercentage) / 100
      );
      const quantity = Math.floor(parseInt(qty, 10));
      const totalOriginal = Math.floor(originalPrice * quantity);
      const totalDiscount = Math.floor(
        (originalPrice - discountedPrice) * quantity
      );
      const finalTotal = Math.floor(discountedPrice * quantity);

      res.status(200).render("user/checkout", {
        address,
        user,
        product,
        totalItems: 1,
        originalTotal: totalOriginal,
        totalDiscount,
        finalTotal,
        message,
        color,
        wallet,
      });
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server Error");
  }
};

const CheckOut = async (req, res) => {
  try {
    const {
      customerId,
      totalValue,
      paymentMethod,
      catqty,
      cartid,
      orderId,
      paymentStatus,
      country,
      name,
      street,
      price,
      offer,
      city,
      state,
      postcode,
      selectedCoupon,
      phone,
    } = req.body;

    console.log("price", price, offer);

    let finalTotal = totalValue;
    console.log("customerId", customerId);

    const wallet = await Wallet.findOne({ userId: customerId.trim() });

    if (selectedCoupon) {
      console.log("0");
      var coupon = await Coupon.findOne({ code: selectedCoupon });
      console.log("uu", coupon);

      if (coupon.minOrderAmount <= totalValue) {
        console.log("1");

        const trimmedCustomerId = customerId.trim();

        if (!coupon.users.includes(trimmedCustomerId)) {
          console.log("2");

          coupon.users.push(new mongoose.Types.ObjectId(trimmedCustomerId));
          coupon.usageLimit--;
          await coupon.save();
          let couponDiscount = coupon.discountValue || 0;
          console.log("couponDiscount", couponDiscount);

          finalTotal -= couponDiscount;
        }
      }
    }

    if (paymentMethod === "Wallet" && wallet.balance >= finalTotal) {
      console.log("walleeet", wallet);

      const transId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const payment = new payments({
        method: paymentMethod,
        status: "completed",
        type: "debit",
        amount: finalTotal,
        userId: customerId.trim(),
        transId: transId,
      });

      payment.save();

      wallet.balance -= finalTotal;

      wallet.save();
    }

    console.log("selectedCoupon:", totalValue);

    const color = req.body.color
      ? []
          .concat(req.body.color)
          .flatMap((c) => c.split(",").map((s) => s.trim()))
      : [];

    console.log("Processed Colors:", color);

    const check = req.session?.buyCheck;
    const formattedCustomerId = customerId.trim();

    if (!mongoose.Types.ObjectId.isValid(formattedCustomerId)) {
      return res.status(400).json({ error: "Invalid customerId format" });
    }

    if (!totalValue) {
      return res.status(400).json({ error: "Total amount is required" });
    }

    let items = [];

    if (Array.isArray(catqty) && catqty.length > 1) {
      items = catqty.map((quantity, index) => ({
        productId: new mongoose.Types.ObjectId(cartid[index]),
        quantity: quantity,
        price: parseFloat(price[index]?.replace(/,/g, "") || 0),
        offer: offer[index] || offer[0],
        coupons: coupon?.discountValue,
        color: Array.isArray(color) ? color[index] || color[0] : color,
      }));
    } else {
      console.log("Single Item Checkout");
      items = [
        {
          productId: new mongoose.Types.ObjectId(cartid),
          quantity: Number(catqty) || 1,
          price: parseFloat(price?.replace(/,/g, "") || 0),
          offer: offer || offer,
          coupons: coupon?.discountValue,
          color: Array.isArray(color) ? color[0] : color,
        },
      ];
    }

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (item.quantity <= product.stock && product.stock !== 0) {
          product.stock -= item.quantity;
          await product.save();
        } else {
          req.flash(
            "count",
            `Not enough stock for this product ${product.productname}`
          );
          return res.status(400).redirect("/productlist");
        }
      } else {
        return res
          .status(404)
          .json({ error: `Product with ID ${item.productId} not found` });
      }
    }

    const billingAddress = {
      country,
      street,
      city,
      state,
      postcode,
      phone,
      name,
    };

    console.log("paymentStatus ", paymentStatus);

    const newOrder = new Orders({
      customerId: formattedCustomerId,
      totalAmount: finalTotal,
      paymentStatus: paymentStatus,
      razorId: orderId,
      paymentMethod: paymentMethod || "Cash on Delivery",
      billingAddress,
      coupon: coupon?._id,
      items,
    });

    await newOrder.save();

    if (check === "Cart") {
      await Cart.deleteMany({ userId: customerId.trim() });
    }

    console.log("Order placed for customerId:", customerId);
    req.flash("userId", customerId.trim());

    res.status(302).redirect("/ordersuccess");
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const OrderView = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    if (
      !mongoose.Types.ObjectId.isValid(orderId) ||
      !mongoose.Types.ObjectId.isValid(productId)
    ) {
      return res.status(404).render("user/404");
    }

    console.log("Fetching Order Details...");
    const returns = await Returns.find({
      $and: [{ orderId: orderId }, { productId: productId }],
    });

    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("customerId")
      .populate("coupon");

    if (!order) {
      console.log("Order not found");
      return res.status(404).json({ error: "Order not found" });
    }

    console.log("Order Found:", order.items);

    console.log(
      "All Product IDs in Order:",
      order.items.map((i) => i.productId._id.toString())
    );

    // Find the specific item in the order
    const item = order.items.find(
      (i) => i.productId._id.toString() === productId
    );
    console.log("return", returns);

    if (!item) {
      console.log("Product not found in order");
      return res.status(404).json({ error: "Product not found in order" });
    }

    res.status(200).render("user/order-details", {
      order,
      item,
      user: order.customerId,
      returns,
    });
  } catch (error) {
    console.error("Error fetching order details:", error.message);
    res.status(500).send(`Error fetching order details: ${error.message}`);
  }
};

const cancellOrder = async (req, res) => {
  try {
    console.log("Request received for updating order status");

    const orderId = req.query.orderId;
    const newStatus = req.query.newStatus;
    const productId = req.query.productId;
    let quantity = parseInt(req.query.quantity);

    const email = req.session.details.email;
    const user = await userSchema.findOne({ email: email });

    console.log("Received Data:", { orderId, newStatus, productId, quantity });

    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("customerId");

    console.log("order", order);

    const wallet = await Wallet.findOne({ userId: user._id });

    console.log("user", user);
    console.log("wallet", wallet);

    if (!order) {
      return res.status(404).send("Order not found");
    }
    const itemToUpdate = order.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (!itemToUpdate) {
      return res.status(404).send("Product not found in order");
    }

    const originalPrice =
      parseFloat(itemToUpdate.productId.price?.toString().replace(/,/g, "")) ||
      0;
    const discountMatch = itemToUpdate.productId.offer
      ? itemToUpdate.productId.offer.match(/\d+/)
      : null;
    const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;
    const discountedPrice =
      originalPrice - (originalPrice * discountPercentage) / 100;

    let total = discountedPrice * itemToUpdate.quantity;

    total -= order?.coupon?.discountValue || 0;

    console.log("total", total);

    const paymentMethod = order.paymentMethod;

    if (paymentMethod == "razorpay" || paymentMethod == "Wallet") {
      const transId = `txn_${Date.now()}_${Math.floor(Math.random() * 10000)}`;

      const amount = total;

      const payment = new payments({
        method: paymentMethod,
        status: "completed",
        type: "credit",
        amount: amount,
        userId: user._id,
        transId: transId,
      });

      payment.save();
      wallet.balance += amount;
      wallet.save();
    }

    itemToUpdate.productId.stock += quantity;

    itemToUpdate.shippingDetails.status = newStatus;

    await itemToUpdate.productId.save();
    await order.save();

    console.log("Updated status:", itemToUpdate);

    res.status(302).redirect(`/orderview/${orderId}/${productId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const orderSuccess = async (req, res) => {
  const userid = req.flash("userId");

  res.status(200).render("user/ordersuccess", { userid });
};

const razorpay = async (req, res) => {
  try {
    const { amount, currency, Discount } = req.body;
    console.log("nnnnnnnnnnn Amount:", Discount);

    discountAmount = amount - Discount;

    let newAmount = Math.floor(discountAmount);
    console.log("Final Amount:", newAmount);

    const order = await razorpayInstance.orders.create({
      amount: newAmount * 100,
      currency: currency || "INR",
      receipt: `receipt_${Date.now()}`,
    });

    console.log("Response Sent:", { order, key: process.env.RAZORPAY_KEY_ID });

    res.status(200).json({ order, key: process.env.RAZORPAY_KEY_ID });
  } catch (error) {
    console.error("Razorpay Order Creation Failed:", error.message);
    res.status(500).json({ error: "Failed to create order" });
  }
};

const verifyPayment = async (req, res) => {
  try {
    const { orderId, paymentId } = req.body;
    console.log("Verifying Payment...");

    await Order.findOneAndUpdate(
      { razorId: orderId },
      { paymentStatus: "Paid", razorpayPaymentId: paymentId }
    );

    res.status(200).json({ success: true, message: "Payment verified successfully" });
  } catch (error) {
    console.error("Payment Verification Failed:", error.message);
    res.status(500).json({ success: false, message: "Payment verification failed" });
  }
};

const orderPlaced = async (req, res) => {
  try {
    const { orderId, paymentStatus } = req.body;
    console.log("Placing order with status:", orderId);

    await Order.findOneAndUpdate({ razorId: orderId }, { paymentStatus });

    res.status(200).json({ success: true, message: "Order placed successfully" });
  } catch (error) {
    console.error("Error updating order:", error.message);
    res.status(500).json({ error: "Failed to update order status" });
  }
};

const getOrderDetails = async (req, res) => {
  try {
    const { orderId } = req.body;

    const order = await Order.findOne({ razorId: orderId });

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    res.status(200).json({
      order: {
        id: order.razorId,
        amount: order.totalAmount,
      },
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

const productReturns = async (req, res) => {
  try {
    const email = req.session.details.email;
    const user = await userSchema.findOne({ email: email });
    const { orderId, productId, quantity, reason } = req.body;
    console.log(user.id);

    const returns = new Returns({
      reason: reason,
      productId: productId,
      orderId: orderId,
      userId: user._id,
      quantity: quantity,
    });
    returns.save();
    res.status(302).redirect(`/orderview/${orderId}/${productId}`);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Failed to process return" });
  }
};

module.exports = {
  buyNow,
  loadCheckout,
  CheckOut,
  orderSuccess,
  cancellOrder,
  OrderView,
  razorpay,
  productReturns,
  verifyPayment,
  orderPlaced,
  getOrderDetails,
};
