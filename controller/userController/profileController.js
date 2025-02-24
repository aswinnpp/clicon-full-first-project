const userSchema = require("../../models/usermodel");
const Address = require("../../models/addressmodel");
const Order = require("../../models/orderdetails");
const Returns = require("../../models/productreturn")
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

    address.save();

    res.redirect(`/profile/${id}`);
  } catch (error) {
    console.log(error);
  }
};


const removeAdrress = async (req, res) => {
  try {
    await Address.findByIdAndDelete(req.query.address);
    res.redirect(`/profile/${req.params.id}`);
  } catch (error) {
    console.error("Remove address error:", error);
    res.status(500).send("Server Error");
  }
};

const editProfile = async (req, res) => {
  try {
    const { userId, name, email, password, phone ,currentPassword } = req.body;

    console.log("00000000000000 ", req.file);

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await userSchema.findById(userId);
    console.log("user", user);

    let images;
    if (req.file) {
      const uploadPath = path.join(
        __dirname,
        "../../uploads/",
        req.file.originalname
      );
      fs.writeFileSync(uploadPath, req.file.buffer);
      images = "/uploads/" + req.file.originalname;
    }

    
    user.name = name || user?.name;
    user.email = email || user?.email;
    user.password = hashedPassword || user?.password;
    user.image = images || user?.image;
    user.phone = phone || user?.phone;

    
    await user.save();

    res.redirect(`/profile/${userId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

const editAddress = async (req, res) => {
  const { adressaId, street, city, state, Country, postalCode, phone, userId } =
    req.body;

       const updatedAddress = await Address.findByIdAndUpdate(adressaId, {
            street,
            city,
            state,
            Country,
            postalCode,
            phone,
          });

  res.redirect(`/profile/${userId}`);
};

module.exports = {
  loadProfile,
  addAddress,
  removeAdrress,
  editProfile,
  editAddress,
};
