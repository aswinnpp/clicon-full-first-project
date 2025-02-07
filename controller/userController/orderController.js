const Order = require("../../models/orderdetails");
const Product = require("../../models/productmodel");
const Cart = require("../../models/cartpagemodel");
const userSchema = require("../../models/usermodel");
const Address = require("../../models/addressmodel");
const mongoose = require("mongoose");
const Orders = require("../../models/orderdetails");
const { orderView } = require("../adminController/orderController");

const buyNow = async (req, res) => {
  try {
    req.session.buyCheck = "buyNow";
    const id = req.params.id;
    const { qty, color } = req.query;
    console.log("=============check", color);

    const email = req.session?.details?.email;
    if (!email) return res.redirect("/signin");

    const product = await Product.findById({ _id: id });
    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect("/signin");

    const address = await Address.find({ userId: user._id });

    const quantity = parseFloat(qty) || 1;
    const cartItems = [{ productId: product, quantity }];

    let originalTotal = 0;
    let totalDiscount = 0;
    let totalValue = 0;

    cartItems.forEach((item) => {
      const originalPrice =
        parseFloat(item.productId.price.replace(/,/g, "")) || 0;
      const discountMatch = item.productId.offer
        ? item.productId.offer.match(/\d+/)
        : null;
      const discountPercentage = discountMatch
        ? parseFloat(discountMatch[0])
        : 0;
      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;

      const itemTotalOriginal = originalPrice * quantity;
      const itemTotalDiscounted = discountedPrice * quantity;
      const discountAmount = itemTotalOriginal - itemTotalDiscounted;

      originalTotal += itemTotalOriginal;
      totalDiscount += discountAmount;
      totalValue += itemTotalDiscounted;
    });

    const message = req.flash("count");

    res.render("user/checkout", {
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
      color
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

    if (!check) return res.redirect("/");






    const email = req.session?.details?.email;
    if (!email) return res.redirect("/login");

    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect("/login");

    const address = await Address.find({ userId: user._id });

    if (check === "Cart") {
      const cartItems = await Cart.findOne({ userId: user._id }).populate({
        path: "items.productId",
        model: "Product",
      });

      if (!cartItems || cartItems.items.length === 0) {
        return res.redirect("/cart"); 
      }
      
      let  color = req.query.color.split(",")

      
      
      console.log("Cart Items:",color );

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
        const discountedPrice =
          originalPrice - (originalPrice * discountPercentage) / 100;

        const quantity = Number(item.quantity);
        const itemTotalOriginal = originalPrice * quantity;
        const itemTotalDiscounted = discountedPrice * quantity;
        const discountAmount = itemTotalOriginal - itemTotalDiscounted;

        originalTotal += itemTotalOriginal;
        totalDiscount += discountAmount;
        totalValue += itemTotalDiscounted;
      });

      res.render("user/checkout", {
        totalItems: cartItems.items.length,
        cartItems,
        originalTotal,
        totalDiscount,
        totalValue,
        address,
        user,
        message,
        color
      
      });
    }

    if (check === "buyNow") {
      const productId = req.session?.productId;
      const qty = req.session?.quantity || 1;

      if (!productId) return res.redirect("/");

      const product = await Product.findById(productId);
      if (!product) return res.redirect("/");

      const originalPrice = parseFloat(product.price.replace(/,/g, "")) || 0;
      const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
      const discountPercentage = discountMatch
        ? parseFloat(discountMatch[0])
        : 0;
      const discountedPrice =
        originalPrice - (originalPrice * discountPercentage) / 100;
      const quantity = parseInt(qty, 10);
      const totalOriginal = originalPrice * quantity;
      const totalDiscount = (originalPrice - discountedPrice) * quantity;
      const finalTotal = discountedPrice * quantity;

      res.render("user/checkout", {
        address,
        user,
        product,
        totalItems: 1,
        originalTotal: totalOriginal,
        totalDiscount,
        finalTotal,
        message,
        color
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
      country,
      name,
      street,
      city,
      state,
      postcode,
      phone,
    } = req.body;

    // Ensure colors are properly processed
    const color = req.body.color
      ? [].concat(req.body.color).flatMap(c => c.split(',').map(s => s.trim()))
      : [];
    
    console.log("Processed Colors:", color);
    
    const check = req.session?.buyCheck;
    const formattedCustomerId = customerId.trim();

    // Validate customerId format
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
        color: Array.isArray(color) ? color[index] || color[0] : color // Assigns a single color per item
      }));
    } else {
      console.log("Single Item Checkout");
      items = [
        {
          productId: new mongoose.Types.ObjectId(cartid),
          quantity: Number(catqty) || 1,
          color: Array.isArray(color) ? color[0] : color // Assigns the first color if array
        },
      ];
    }

    
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (product) {
        if (item.quantity <= product.stock) {
          product.stock -= item.quantity;
          await product.save();
        } else {
          req.flash(
            "count",
            `Not enough stock for this product ${product.productname}`
          );
          return res.redirect("/productlist");
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

    // Create a new order
    const newOrder = new Orders({
      customerId: formattedCustomerId,
      totalAmount: totalValue,
      paymentMethod: paymentMethod || "Cash on Delivery",
      billingAddress,
      items,
    });

    await newOrder.save();

    // If coming from cart, clear the cart after checkout
    if (check === "Cart") {
      await Cart.deleteMany({ userId: customerId.trim() });
    }

    console.log("Order placed for customerId:", customerId);

    res.render("user/ordersuccess", { userid: customerId.trim() });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const OrderView = async (req, res) => {
  try {
    const { orderId, productId } = req.params;

    console.log("Fetching Order Details...");


    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("customerId");

    if (!order) {
      console.log("Order not found");
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

    console.log("ssssssssssss", item);

    if (!item) {
      console.log("Product not found in order");
    }
    console.log("sssssssssssss", item);

    // Render the order details page
    res.render("user/order-details", { order, item, user: order.customerId });
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
    let quantity = parseInt(req.query.quantity, 10);

    console.log("Received Data:", { orderId, newStatus, productId, quantity });

    // Find the order
    const order = await Order.findById(orderId)
      .populate("items.productId")
      .populate("customerId");

    if (!order) {
      return res.status(404).send("Order not found");
    }

    const itemToUpdate = order.items.find(
      (item) => item.productId._id.toString() === productId
    );

    if (!itemToUpdate) {
      return res.status(404).send("Product not found in order");
    }

    itemToUpdate.productId.stock += quantity;

    itemToUpdate.shippingDetails.status = newStatus;

    await itemToUpdate.productId.save();
    await order.save();

    console.log("Updated status:", itemToUpdate);

    res.redirect(`/orderview/${orderId}/${productId}`);
  } catch (error) {
    console.error(error);
    res.status(500).send("Server error");
  }
};

const orderSuccess = (req, res) => {
  res.render("user/ordersuccess");
};

module.exports = {
  buyNow,
  loadCheckout,
  CheckOut,
  orderSuccess,
  cancellOrder,
  OrderView,
};
