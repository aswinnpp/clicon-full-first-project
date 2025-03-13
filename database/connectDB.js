const mongoose = require("mongoose");
const env =require('dotenv').config()

const connectDb = async () => {
  try {
    const conn = await mongoose.connect('mongodb+srv://aswin:%23Aswin123@clicon.2qszk.mongodb.net/clicon',{});

    console.log(`MongoDB Connected:${conn.connection.host}`);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

module.exports = connectDb;
