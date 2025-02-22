const bcrypt = require("bcrypt");
const userSchema = require("../../models/usermodel");
const wallet = require("../../models/walletmodel")
const payments = require("../../models/paymentmodel")
const { generateOTP, sendOtpEmail } = require("./helpers");

const loadSignUp = (req, res) => {
  res.render("user/usersignup", { message: req.flash("success"), googleClientId: process.env.GOOGLE_CLIENT_ID });
};

const signUp = async (req, res) => {
  try {
    const { email, password, name ,referralCode } = req.body;
    const existingUser = await userSchema.findOne({ email });
    if (existingUser) {
      req.flash("success", "User already exists.");
      return res.redirect("/signup");
    }

    const otp = generateOTP();
    req.session.otp = otp;
    req.session.type = "signup";
    req.session.timestamp = Date.now();
    req.session.details = { email, password, name };
    req.session.referralCode=referralCode 

    sendOtpEmail(email, otp);
    res.redirect("/otp");
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).send("Server Error");
  }
};

const loadSignIn = (req, res) => {
  res.render("user/usersignin", { error: req.flash("error") , googleClientId: process.env.GOOGLE_CLIENT_ID});
};

const signIn = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await userSchema.findOne({ email });

    if (!user) {
      req.flash("error", "User not found!");
      return res.redirect("/signin");
    }

    if (user.isBan) {
      req.flash("error", "User Banned By Admin!");
      return res.redirect("/signin");
    }

    if (!(await bcrypt.compare(password, user.password))) {
      req.flash("error", "Incorrect Password!");
      return res.redirect("/signin");
    }

    req.session.details = { email };
    req.session.logged = true;
    res.redirect("/");
  } catch (error) {
    console.error("Signin error:", error);
    res.status(500).send("Server Error");
  }
};

const Logout = (req, res) => {
  req.session.destroy();
  res.redirect("/");
};

const loadOtp = (req, res) => {
  res.render("user/otpverify", { OTP: req.flash("OTP") });
};


const generateReferralCode = () => Math.random().toString(36).substr(2, 8).toUpperCase();


const verifyOTP = async (req, res) => {
  const { otp } = req.body;
  
  if (parseInt(otp) !== req.session.otp) {
    req.flash("OTP", "Invalid OTP. Please try again.");
    return res.redirect("/otp");
  }

  if (req.session.type === "signup") {
    const { email, password, name } = req.session.details;
    const referralCode = req.session.referralCode
    const hashedPassword = await bcrypt.hash(password, 10);

    
    const userReferralCode = generateReferralCode();

    let referredBy = null;

      const newUser = await new userSchema({
        email,
        password: hashedPassword,
        name,
        referralCode: userReferralCode, 
        referredBy,
        walletBalance: 0, 
      }).save();

    const newWallet = new wallet({
      userId: newUser._id,
      paymentId: "",
      balance: 0,
    });

    await newWallet.save();

    if (referralCode) {
      console.log("referralCode",referralCode);
      
      const referrer = await userSchema.findOne({ referralCode });

      if (referrer) {
        console.log("referrer",referrer);
        
        referredBy = referrer._id; 

        
        referrer.walletBalance += 50;
        await referrer.save();

     
        const referrerWallet = await wallet.findOne({ userId: referrer._id });
        if (referrerWallet) {
          console.log("referrerWallet",referrerWallet);
          
          referrerWallet.balance += 50;
          await referrerWallet.save();
        }
     
        const transId = `Ref${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    
        await new payments({
          transId: transId,
          userId: referrer._id,
          method: "Wallet",
          status: "completed",
          amount: 50,
          type: "credit",
        }).save();
      }
    }

  

   

    req.flash("success", "User registered successfully.");
    res.redirect("/signin");
  } else if (req.session.type === "forgot") {
    res.render("user/resetpassword");
  }
};


const resendOtp = async (req, res) => {
  const newOtp = generateOTP();
  req.session.otp = newOtp;
  req.session.timestamp = Date.now();
  await sendOtpEmail(req.session.details?.email, newOtp);
  res.redirect("/otp");
};

const authsignup = async (req, res) => {
  console.log("kjhgghjkl;lkjhgfdfghjkl;lkjhgvcvbnjkkjbvc");

  const data = req.body.data;
  const email = data.email;
  const user = await userSchema.findOne({ email });
  console.log(user);

  if (user) {
    return res.json({ status: "not done" });
  } else {
    console.log(data);
  let userReferralCode =  generateReferralCode()
    const newUser = new userSchema({
      email: data.email,
      name: data.name,
      image: data.imageUrl,
      referralCode: userReferralCode, 
    });
    
    const newWallet = new wallet({
      userId: newUser._id,
      paymentId: '',
      balance: 0
  });
  await newWallet.save();

    req.session.details = { email };
    req.session.logged = true;
    newUser.authuser = true;
    await newUser.save();
    res.redirect(302, "/");
  }
};

const authsignin = async (req, res) => {
  console.log("kjhgghjkl;lkjhgfdfghjkl;lkjhgvcvbnjkkjbvc");

  const data = req.body.data;
  const email = data.email;
  const user = await userSchema.findOne({ email });

  console.log(user);

  if (!user) {
    return res
      .status(404)
      .json({ status: "not done", message: "user not found" });
  }

  if (user.isBan === true) {
    return res.status(401).json({ message: "user banned By Admin" });
  }

  req.session.details = { email };
  req.session.logged = true;

  res.redirect(302, "/");
};

module.exports = {
  loadSignUp,
  signUp,
  loadSignIn,
  signIn,
  Logout,
  loadOtp,
  verifyOTP,
  resendOtp,
  authsignup,
  authsignin,
};
