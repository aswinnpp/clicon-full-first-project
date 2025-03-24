const Returns = require("../../models/productreturn");
const Wallet = require("../../models/walletmodel");
const Order = require("../../models/orderdetails");
const payments = require("../../models/paymentmodel");
const User = require("../../models/usermodel");

const loadReturns = async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = 5;
    let skip = (page - 1) * limit;

    let returns = await Returns.find({})
      .populate("userId")
      .populate("productId")
      .populate("orderId")
      .skip(skip)
      .limit(limit)
      .lean();

    returns.sort((a, b) => {
      if (a.orderId?.createdAt && b.orderId?.createdAt) {
        return new Date(b.orderId.createdAt) - new Date(a.orderId.createdAt);
      }
      return 0;
    });
    console.log("lll", returns);

    const totalReturns = await Returns.countDocuments();
    const totalPages = Math.ceil(totalReturns / limit);

    res.status(200).render("admin/productreturns", {
      returns,
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const productApprove = async (req, res) => {
  try {
    const { productId, userId, orderId } = req.body;

    const returns = await Returns.find({ productId, orderId, userId });
    const wallet = await Wallet.findOne({ userId: userId });
    const order = await Order.findById(orderId).populate("items.productId");
    const user = await User.findById(userId);

    if (!order) {
      return res.status(404).send("Order not found");
    }
    if (!user) {
      return res.status(404).send("User not found");
    }

    console.log("Order Items:", order.items);

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

    if (returns.length > 0) {
      for (let returnItem of returns) {
        returnItem.status = "Approved";
        await returnItem.save();
      }

      // Update product stock by adding back the returned quantity
      if (itemToUpdate.productId) {
        const returnedQuantity = itemToUpdate.quantity;
        await itemToUpdate.productId.updateOne({
          $inc: { stock: returnedQuantity }
        });
        console.log(`Updated stock for product ${productId}, added ${returnedQuantity} units back to inventory`);
      }

      const paymentMethod = order.paymentMethod;

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

      await payment.save();

      await Wallet.updateOne(
        { userId: user._id },
        { $inc: { balance: amount } }
      );
    }

    res.status(200).redirect("/admin/returns");
  } catch (error) {
    console.error("Error in productApprove:", error);
    res.status(500).send("Server error");
  }
};

const productRejected = async (req, res) => {
  try {
    const { productId, userId, orderId } = req.body;

    const returns = await Returns.find({ productId, orderId, userId });

    if (returns.length > 0) {
      for (let returnItem of returns) {
        returnItem.status = "Rejected";
        await returnItem.save();
      }
      res.status(200).redirect("/admin/returns");
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Server error");
  }
};

const notification = async (req, res) => {
  try {
    const newReturns = await Returns.find({ status: "Pending" }).sort({
      createdAt: -1,
    });

    res.status(200).json(newReturns);
  } catch (err) {
    console.error("Error fetching new returns:", err);
    res.status(500).json({ error: "Server error" });
  }
};

module.exports = {
  loadReturns,
  productApprove,
  productRejected,
  notification,
};
