const Cart = require("../../models/cartpagemodel");
const Product = require("../../models/productmodel");
const userSchema = require("../../models/usermodel");

// Load Cart
const loadCart = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    if (!email) return res.redirect('/login');

    const user = await userSchema.findOne({ email });
    if (!user) return res.redirect('/login');

    const page = parseInt(req.query.page) || 1; // Current page
    const limit = 4; // Items per page
    const skip = (page - 1) * limit;

    const cart = await Cart.findOne({ userId: user._id }).populate({
      path: 'items.productId',
      model: 'Product',
    });

    if (!cart || !cart.items.length) {
      return res.render('user/cart', {
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

      const originalPrice = parseFloat(item.productId.price.replace(/,/g, '')) || 0;

      const discountMatch = item.productId.offer ? item.productId.offer.match(/\d+/) : null;
      const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;

      const discountedPrice = originalPrice - (originalPrice * discountPercentage / 100);

      return sum + discountedPrice * (item.quantity || 1);
    }, 0);

    res.render('user/cart', {
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



// Add to Cart
const Carts = async (req, res) => {
  try {
    const email = req.session?.details?.email;
    if (!email) return res.redirect('/login');

    const user = await userSchema.findOne({ email });
    const userId = user?._id;
    const { productId, quantity, stock } = req.body;
    
    const parsedQuantity = Number(quantity);
    
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).send("Product not found.");
    }

    let cart = await Cart.findOne({ userId }).populate('items.productId');

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity: parsedQuantity }],
      });
      await cart.save();
      return res.redirect('/cart');
    }

    let itemFound = false;

    // Check each item in the cart
    for (let i = 0; i < cart.items.length; i++) {
      if (cart.items[i].productId.toString() === productId) {
        const newQuantity = cart.items[i].quantity + parsedQuantity;

        if (newQuantity > 5) {
          req.flash("cart", "You cannot add more than 5 items of one product.");
          return res.redirect('/');
        } else if (newQuantity > stock) {
          req.flash("cart", `Available stock limit is ${stock}`);
          return res.redirect('/');
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
        return res.redirect('/');
      }
      cart.items.push({ productId, quantity: parsedQuantity });
    }

    // Calculate price after discount
    let price = parseFloat(product.price.replace(/,/g, '')) || 0;

    // Extract discount percentage from "18% Off"
    const discountMatch = product.offer ? product.offer.match(/\d+/) : null;
    const discountPercentage = discountMatch ? parseFloat(discountMatch[0]) : 0;

    // Apply discount
    let finalPrice = price - (price * discountPercentage / 100);

    console.log(`Original Price: ${price}, Discount: ${discountPercentage}%, Final Price: ${finalPrice}`);

    await cart.save();
    req.session.buyCheck = "Cart";  
    return res.redirect('/cart');

  } catch (error) {
    console.error(error);
    res.status(500).send("Server Error");
  }
};


// Remove from Cart
const cartDelete = async (req, res) => {
  try {
    const { userid, productid } = req.query;
    await Cart.updateOne({ userId: userid }, { $pull: { items: { productId: productid } } });
    res.redirect("/");
  } catch (error) {
    console.error("Cart delete error:", error);
    res.status(500).send("Server Error");
  }
};

module.exports = {
  loadCart,
  Carts,
  cartDelete,
};