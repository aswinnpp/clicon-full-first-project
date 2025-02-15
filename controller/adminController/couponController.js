const Coupon = require("../../models/couponmodel")



const loadCouponmanage = async (req, res) => {
  try {


    const coupons = await Coupon.find({}); 
    console.log("ssssssssss",coupons);
    res.render("admin/couponmanage",{coupons});
  } catch (error) {
    console.log(error);
  }
};



const loadCouponCreate = async (req, res) => {
  try {
   
    const message = req.flash("message")
    res.render("admin/couponcreate",{message})
  } catch (error) {
    console.error("Error loading coupons:", error);
    res.status(500).send("Internal Server Error");
  }
};







 const couponCreate = async (req, res) => {


  try {
    const { code, discountValue, minOrderAmount, usageLimit, expiryDate, startDate } = req.body;


 

    const existingCoupon = await Coupon.findOne({ code });
    
    if (existingCoupon) {
      req.flash("message", "Coupon code already exists.");
      return res.redirect("/admin/couponcreate");
    }

   
    
    const newCoupon = new Coupon({
      code,
      discountValue,
      minOrderAmount: minOrderAmount || 0, 
      usageLimit: usageLimit || 1,
      startDate,
      expiryDate,
      
    });

    await newCoupon.save();
   
    res.redirect("/admin/couponmanage"); // Redirect to coupon list page
  } 
  catch (error) {
    console.error(error);
    req.flash("message", "Server error. Please try again.");
    res.redirect("/admin/couponcreate");
  }
 }




 const deleteCoupon = async (req, res) => {
  try {
    const { couponId } = req.query;

    const coupon = await Coupon.findById(couponId);
    if (!coupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

    const updatedCoupon = await Coupon.findByIdAndUpdate(
      couponId,
      { isActive: !coupon.isActive }, 
      { new: true } 
    );

    return res.status(200).json({ 
      success: true, 
      message: updatedCoupon.isActive ? "Coupon restored successfully" : "Coupon deactivated successfully",
      isActive: updatedCoupon.isActive
    });

  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};




const couponEdit = async (req, res)=>{
  try {

 const {couponId} = req.query


 const message = req.flash("message")

 console.log("hhhhhhhhhh",couponId)
  const coupon = await Coupon.findOne({_id:couponId })

    res.render("admin/couponedit",{coupon,message})
  } catch (error) {
    
  }
}




const updateCoupon = async (req, res) => {
  try {
    const { id, code, discountValue, minOrderAmount, usageLimit, expiryDate ,startDate } = req.body;

   
    console.log(startDate);
    

    if (!id) {
      return res.status(400).json({ success: false, message: "Coupon ID is required" });
    }


  



    const updatedCoupon = await Coupon.findByIdAndUpdate(
      id,
      {
        code,
        discountValue,
        minOrderAmount,
        usageLimit,
        expiryDate: new Date(expiryDate), 
        startDate:new Date(startDate)
        
      },
      { new: true }
    );

    if (!updatedCoupon) {
      return res.status(404).json({ success: false, message: "Coupon not found" });
    }

   res.redirect("/admin/couponmanage")

  } catch (error) {
    console.error("Error updating coupon:", error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
};



  


module.exports = {
   loadCouponmanage,
  loadCouponCreate,
  couponCreate,
  deleteCoupon,
  couponEdit ,
  updateCoupon
  
 };