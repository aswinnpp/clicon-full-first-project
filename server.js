const express=require('express')
const app = express()
const adminRoute= require('./routes/admin')
const userRoute= require('./routes/user')
const path=require('path')
const connectDB = require("./database/connectDB");
const session = require("express-session");
const nocache = require("nocache");
const env =require("dotenv").config()
const flash = require('connect-flash');
app.use(flash());


connectDB();
app.use(session({
  secret: 'secretKey',
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }

}));

app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


app.use('/admin',adminRoute)
app.use('/',userRoute)
// app.use((req, res, next) => {
//   res.locals.message = req.flash('error');
//   res.locals.success = req.flash('success');
//   next();
// });

app.listen(process.env.PORT,()=>{
  console.log('PORT connected')
})