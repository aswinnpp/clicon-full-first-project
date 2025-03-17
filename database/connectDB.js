const mongoose = require("mongoose");
const env =require('dotenv').config()

const connectDb = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI,{});

    console.log(`MongoDB Connected:${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDb;
