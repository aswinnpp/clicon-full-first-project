// Load Wishlist
const loadWhishlist = (req, res) => {
    res.render("user/wishlist", { user: req.session.details });
  };
  
  module.exports = {
    loadWhishlist,
  };