const express=require('express')
const app = express()
const adminRoute= require('./routes/admin')
const userRoute= require('./routes/user')
const path=require('path')
const connectDB = require("./database/connectDB");
const session = require("express-session");
const nocache = require("nocache");
const env =require("dotenv").config()

connectDB();
app.use(nocache());
app.use(
  session({
    secret: "mysecretkey",
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false, maxAge: 1000 * 60 * 60 * 24 },
  })
);

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/admin',adminRoute)
app.use('/user',userRoute)


app.listen(process.env.PORT,()=>{
  console.log('PORT connected')
})