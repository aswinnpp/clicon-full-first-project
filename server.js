const express = require("express");
const Order = require("./models/orderdetails");
const app = express();
const adminRoute = require("./routes/admin");
const userRoute = require("./routes/user");
const path = require("path");
const Returns = require("./models/productreturn");
const helmet = require("helmet")
const connectDB = require("./database/connectDB");
const session = require("express-session");
const nocache = require("nocache");
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
const env = require("dotenv").config();
const flash = require("connect-flash");
const bodyParser = require("body-parser");
const cors = require("cors");
app.use(cors({ origin: "*" }));

const cron = require("node-cron");
const Coupon = require("./models/couponmodel");
const { strict } = require("assert");
// const morgan = require('morgan')

cron.schedule("* * * * * * *", async () => {
  try {



    const today = new Date();
    today.setHours(0, 0, 0, 0)
    const result = await Coupon.updateMany(
      { expiryDate: { $lt:today}, isActive: true },
      { $set: { isActive: false } }
    );

 

  } catch (error) {
    console.error("Error updating expired coupons:", error);
  }
});

app.use(nocache());
app.use(nocache());

app.use(nocache());

// app.use(morgan('dev'))
app.use(cors());
app.use(flash());





connectDB();
app.use(
  session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/admin", adminRoute);
app.use("/", userRoute);

app.listen(process.env.PORT, () => {
  console.log("PORT connected");
});

