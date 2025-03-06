const userSchema = require("../../models/usermodel");
const Address = require("../../models/addressmodel");
const Order = require("../../models/orderdetails");
const Returns = require("../../models/productreturn")
const { generateOTP, sendOtpEmail } = require("./helpers");
const bcrypt = require("bcrypt");
const path = require("path");
const fs = require("fs");


const loadProfile = async (req, res) => {
  try {
    const id = req.params.id;
    console.log(req.session);
    const orders = await Order.find({ customerId: id })
      .populate({
        path: "items.productId",
        select: "productname price offer",
      })
      

      const returns = await Returns.find({ userId: id })
      .populate("productId", "productname price images")
      .populate("orderId");
     

    const user = await userSchema.findOne({ _id: id });
    const address = await Address.find({ userId: id });

    res.render("user/profile", { user, id, address, orders,returns });
  } catch (error) {
    console.log(error);
  }
};

const addAddress = async (req, res) => {
  try {
    console.log(req.body);
    const { postalCode, country, state, phone, city, street, id } = req.body;

    const address = new Address({
      postalCode,
      country,
      state,
      phone,
      city,
      street,
      userId: id,
    });

    await address.save();

    // If it's an AJAX request, send JSON response
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      const savedAddress = await address.populate('userId');
      res.json({ 
        success: true, 
        address: savedAddress,
        message: 'Address added successfully' 
      });
    } else {
      res.redirect(`/profile/${id}`);
    }
  } catch (error) {
    console.log(error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to add address' 
      });
    } else {
      res.redirect(`/profile/${id}`);
    }
  }
};

const removeAdrress = async (req, res) => {
  try {
    const { address } = req.query; 

    console.log("ssssssssss",req.query)

    const deletedAddress = await Address.findByIdAndDelete(address);

    if (!deletedAddress) {
      return res.status(404).json({
        success: false,
        message: "Address not found",
      });
    }

    return res.status(200).json({
      success: true,
      address,
      message: "Address deleted successfully",
    });

  } catch (error) {
    console.error("Remove address error:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to delete address. Please try again.",
    });
  }
};

const editProfile = async (req, res) => {
  try {
    const { userId, name, email, password, phone, currentPassword, emailVerification } = req.body;

    console.log("Request Body:", req.body);
 console.log("userId",userId)
    const user = await userSchema.findOne({_id:userId});
    console.log("user")
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (emailVerification) {
      const verifiedUser = await userSchema.findOne({ email: emailVerification });

      if (!verifiedUser) {
        return res.status(400).json({ error: "Email not found in records." });
      }

      req.session.type = "change";
      const otp = generateOTP();
      req.session.otp = otp;
      req.session.timestamp = Date.now();
      req.session.forgot = verifiedUser.email;

      sendOtpEmail(emailVerification, otp);
      return res.redirect("/otp");
    }

    if (password) {
      if (!currentPassword) {
        return res.status(400).json({ error: "Current password is required." });
      }

      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        console.log("Incorrect current password.");
        return res.status(400).json({ error: "Incorrect current password." });
      }

      user.password = await bcrypt.hash(password, 10);
    }

    let newImage = user.image;
    if (req.file) {
      const uploadDir = path.join(__dirname, "../../uploads/");
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, req.file.originalname);
      fs.writeFileSync(filePath, req.file.buffer);
      newImage = "/uploads/" + req.file.originalname;
    }

    // Update User Profile
    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;
    user.image = newImage;

    await user.save();

    res.json({ 
      success: true, 
      message: "Profile updated successfully.", 
      redirectUrl: `/profile/${userId}` 
    });

  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};


const editAddress = async (req, res) => {
  try {
    const { adressaId, street, city, state, Country, postalCode, phone, userId } = req.body;

    const updatedAddress = await Address.findByIdAndUpdate(
      adressaId, 
      {
        street,
        city,
        state,
        Country,
        postalCode,
        phone,
      },
      { new: true }
    );

    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.json({ 
        success: true, 
        address: updatedAddress,
        message: 'Address updated successfully' 
      });
    } else {
      res.redirect(`/profile/${userId}`);
    }
  } catch (error) {
    console.log(error);
    if (req.xhr || req.headers.accept.indexOf('json') > -1) {
      res.status(500).json({ 
        success: false, 
        message: 'Failed to update address' 
      });
    } else {
      res.redirect(`/profile/${userId}`);
    }
  }
};

module.exports = {
  loadProfile,
  addAddress,
  removeAdrress,
  editProfile,
  editAddress,
};
