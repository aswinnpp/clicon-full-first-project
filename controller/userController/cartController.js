const Cart = require("../../models/cartpagemodel");
const Product = require("../../models/productmodel");
const wishlist = require("../../models/whishlist");
const userSchema = require("../../models/usermodel");

const loadCart = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    if (!email) return res.redirect("/login");

    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect("/login");

    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: "items.productId",
      model: "Product",
    });

    if (!cart || !cart.items.length) {
      return res.render("user/cart", {
        items: [],
        currentPage: 0,
        totalPages: 0,
        totalItems: 0,
        totalValue: "0.00",
      });
    }

    req.session.buyCheck = "Cart";

    const totalItems = cart.items?.length;
    const paginatedItems = cart.items?.slice(skip, skip + limit);
    const totalPages = Math.ceil(totalItems / limit);

    const totalValue = cart.items.reduce((sum, item) => {
      if (!item.productId) return sum;

      const originalPrice =
        parseFloat(item.productId.price.replace(/,/g, "")) || 0;

      const discountMatch = item.productId.offer
        ? item.productId.offer.match(/\d+/)
        : null;
      const discountPercentage = discountMatch
        ? parseFloat(discountMatch[0])
        : 0;

      const discountedPrice = Math.floor(
        originalPrice - (originalPrice * discountPercentage) / 100
      );

      return sum + discountedPrice * (item.quantity || 1);
    }, 0);

    res.render("user/cart", {
      items: paginatedItems,
      user,
      currentPage: page,
      totalPages,
      totalItems,
      totalValue: totalValue.toFixed(2),
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const Carts = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    if (!email) return res.redirect("/login");

    const user = await userSchema.findOne({ email });
    const userId = user?._id;
    const { productId, quantity, stock, selectedColor } = req.body;

    const parsedQuantity = Number(quantity);

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    let cart = await Cart.findOne({ userId }).populate("items.productId");

    await wishlist.findOneAndUpdate(
      { userId },
      { $pull: { items: { productId } } }
    );

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity: parsedQuantity, color: selectedColor }],
      });
      await cart.save();
      return res.redirect("/cart");
    }

    let itemFound = false;

    for (let i = 0; i < cart.items.length; i++) {
      if (cart.items[i].productId.toString() === productId) {
        const newQuantity = cart.items[i].quantity + parsedQuantity;
  console.log("newQuantity",stock);
  
        if (newQuantity > 5) {
          req.flash("cart", "You cannot add more than 5 items of one product.");
          return res.redirect("/");
        } else if (newQuantity > stock) {
          req.flash("cart", `Available stock limit is ${stock}`);
          return res.redirect("/");
        } else {
          cart.items[i].quantity = newQuantity;
          itemFound = true;
        }
        break;
      }
    }

    if (!itemFound) {
      if (parsedQuantity > 5) {
        req.flash("cart", "You cannot add more than 5 items of this product.");
        return res.redirect("/");
      }
      cart.items.push({
        productId,
        quantity: parsedQuantity,
        color: selectedColor,
      });
    }

    let price = parseFloat(product.price.replace(/,/g, "")) || 0;

    const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
    const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;

    let finalPrice = Math.floor(price - (price * discountPercentage) / 100);

    console.log(
      `Original Price: ${price}, Discount: ${discountPercentage}%, Final Price: ${finalPrice}`
    );

    await cart.save();
    req.session.buyCheck = "Cart";
    return res.redirect("/cart");
  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};

const cartDelete = async (req, res) => {
  try {
    const { userid, productid } = req.query;
    await Cart.updateOne(
      { userId: userid },
      { $pull: { items: { productId: productid } } }
    );
    res.redirect("/cart");
  } catch (error) {
    console.error("Cart delete error:", error);
    res.status(500).send("Server Error");
  }
};

const updateCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const user = await userSchema.findOne({ email: req.session.details.email });
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() === productId
    );
    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart" });
    }

    const newQuantity = Number(quantity);

    if (newQuantity > 5) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity cannot exceed 5" });
    }

    if (newQuantity > product.stock) {
      return res.status(400).json({
        success: false,
        message: `Stock limit exceeded. Only ${product.stock} items available`,
      });
    }

    cart.items[itemIndex].quantity = newQuantity;
    await cart.save();

    return res
      .status(200)
      .json({ success: true, message: "Cart updated successfully" });
  } catch (error) {
    console.error("Update cart error:", error);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

const getSummery = async (req, res) => {
  try {
    const user = await userSchema.findOne({ email: req.session.details.email });
    const items = await Cart.find({ userId: user._id }).populate(
      "items.productId"
    );

    let originalTotal = 0;
    let totalDiscount = 0;
    let finalTotal = 0;
    let totalItems = 0;
    items.forEach((cart) => {
      cart.items.forEach((item) => {
        if (item.productId && item.productId.price) {
          const originalPrice =
            parseFloat(item.productId.price.replace(/,/g, "")) || 0;
          const discountMatch = item.productId.offer
            ? item.productId.offer.match(/\d+/)
            : null;
          const discountPercentage = discountMatch
            ? parseFloat(discountMatch[0])
            : 0;

          const singleItemDiscountedPrice =
            originalPrice - (originalPrice * discountPercentage) / 100;
          const singleItemOriginalTotal = originalPrice;
          const singleItemDiscountAmount =
            originalPrice - singleItemDiscountedPrice;

          const itemTotalOriginal = singleItemOriginalTotal * item.quantity;
          const itemTotalDiscounted = singleItemDiscountedPrice * item.quantity;
          const discountAmount = singleItemDiscountAmount * item.quantity;
        }

        originalTotal += itemTotalOriginal;
        totalDiscount += discountAmount;
        finalTotal += itemTotalDiscounted;
        totalItems += item.quantity;
      });
    });

    console.log(originalTotal, totalDiscount, finalTotal, totalItems);

    res.json({
      originalTotal,
    });
  } catch (error) {
    console.error("Error calculating cart summary:", error);
    res.status(500).json({ error: "Error calculating cart summary" });
  }
};

module.exports = {
  updateCart,
  loadCart,
  Carts,
  cartDelete,
  getSummery,
};
