const loadCouponmanage = async (req, res) => {
    try {
      res.render("admin/couponmanage");
    } catch (error) {
      console.log(error);
    }
  };
  
  module.exports = { loadCouponmanage };