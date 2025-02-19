 const wishlistModel = require("../../models/whishlist")
 const Cart = require("../../models/cartpagemodel")
 const userModel = require("../../models/usermodel")

 const loadWhishlist = async (req, res) => {
  try {
    const email = req.session?.details?.email;

    if (!email) {
      return res.status(400).send("User email not found in session");
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(400).send("User not found");
    }

    const wishlist = await wishlistModel
      .findOne({ userId: user._id })
      .populate({
        path: "items.productId",
        model: "Product",
      }); 

      console.log("kkkkkkkkkkkk",wishlist);
      

    res.render("user/wishlist", { user, wishlist: wishlist || [] });
  } catch (error) {
    console.error("Error loading wishlist:", error);
    res.status(500).send("Internal server error");
  }
};



const wishlist = async (req, res) => {
  try {
    

    const { productId } = req.query;
    const email = req.session?.details?.email;

    

    if (!email) {
      res.redirect("/signin")
      return
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      res.redirect("/signin")
      return
    }

    

    if (!user._id) {
      res.redirect("/signin")
      return 
    }

    let wishlist = await wishlistModel.findOne({ userId: user._id });
    let cart= await Cart.findOne({ userId: user._id });


    if (wishlist && cart) {

      const productExists = wishlist?.items.some(item => item.productId.toString() === productId);
      const productIncart = cart?.items.some(item => item.productId.toString() === productId);

      if (productExists) {
        req.flash("cart", "Product is already in wishlist" );
        res.redirect("/")
        return
      }

      if (productIncart) {
      req.flash("cart", "Product is already in cart" );
      res.redirect("/")
      return
      
      }

      wishlist.items.push({ productId });
      await wishlist.save();
      console.log("Product added to existing wishlist");
    } else {
      wishlist = new wishlistModel({
        userId: user._id,
        items: [{ productId }]
      });

      await wishlist.save();
      console.log("New wishlist created and product added",wishlist);
    }

    res.redirect("/wishlist")

  } catch (error) {
    console.error("Error saving wishlist:", error);
    return res.status(500).json({ message: "Internal server error" });
  }
};


const removeProduct = async (req,res)=>{
  try {

    const  {userId,productId} = req.query
    console.log("userId",userId)

    await wishlistModel.updateOne(
      { userId: userId },
      { $pull: { items: { productId: productId } } }
    );
    res.redirect("/wishlist");
    
  } catch (error) {
    
    console.log(error)
  }
}
module.exports = {
  loadWhishlist,
  wishlist,
  removeProduct
};
