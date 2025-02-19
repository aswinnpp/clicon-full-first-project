const User = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const Coupon = require("../../models/couponmodel");
const Product = require("../../models/productmodel")
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");



const loadLogin = async (req, res) => {
  try {
    return res.render("admin/login");
  } catch (error) {
    console.log("adminlogin page not found");
    res.status(500).send("server error");
  }
};

const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await User.findOne({
      email: { $regex: new RegExp(`^${email}$`, "i") },
      role: "admin",
    });

    if (!admin || admin.role !== "admin") {
      return res.render("admin/login", { message: "Invalid credential" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.render("admin/login", { message: "Invalid password" });
    }

    req.session.admin = true;
    req.session.userId = admin;
    res.redirect("/admin/dashboard");
  } catch (error) {
    console.log(error);
    res.render("admin/login", { message: "Login failed" });
  }
};


const getSalesData = async (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const orders = await Order.find({ createdAt: { $gte: start, $lt: end } })
    .populate('customerId')  
    .populate('coupon')
    .populate('items.productId'); 

  let totalOrders = 0;
  let totalRevenue = 0;
  let totalCouponDiscount = 0;
  let totalProductDiscount = 0;

  orders.forEach(order => {
    totalOrders++;
    totalRevenue += order.totalAmount;

    if (order.coupon) {
      totalCouponDiscount += order.coupon.discountValue;
    }

    order.items.forEach(item => {
      const offer = item.productId.offer;
      const offerPercentage = offer ? parseFloat(offer) / 100 : 0;

      const productPrice = parseFloat(item.productId.price.replace(/,/g, ''));
      const itemDiscount = offerPercentage * productPrice;

      totalProductDiscount += itemDiscount;
    });
  });

  
  return {
    totalOrders,
    totalRevenue,
    totalCouponDiscount,
    totalProductDiscount
  };
};

const getWeeklySales = async () => {
  const weeklySales = [];

  for (let i = 6; i >= 0; i--) {
    let startOfDay = new Date();
startOfDay.setHours(0, 0, 0, 0);
    startOfDay.setDate(new Date().getDate() - i);
    let endOfDay = new Date(startOfDay);
    endOfDay.setHours(23, 59, 59, 999);

    const dailySales = await getSalesData(startOfDay, endOfDay);
    weeklySales.push(dailySales);
  }

  return weeklySales;
};

const getMonthlySales = async () => {
  const monthlySales = [];

  for (let i = 11; i >= 0; i--) {
    const startOfMonth = new Date();
   
    startOfMonth.setHours(0, 0, 0, 0);
    startOfMonth.setMonth(startOfMonth.getMonth() - i);
    startOfMonth.setDate(1);
    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);
    endOfMonth.setDate(0);
    endOfMonth.setHours(23, 59, 59, 999);

    const monthlySalesData = await getSalesData(startOfMonth, endOfMonth);
    monthlySales.push(monthlySalesData);
  }

  return monthlySales;
};

const getYearlySales = async () => {
  const yearlySales = [];

  for (let i = 4; i >= 0; i--) {
    const startOfYear = new Date();
    startOfYear.setHours(0, 0, 0, 0);

    startOfYear.setFullYear(startOfYear.getFullYear() - i);
    startOfYear.setMonth(0);
    startOfYear.setDate(1);
    const endOfYear = new Date(startOfYear);
    endOfYear.setFullYear(endOfYear.getFullYear() + 1);
    endOfYear.setDate(0);
    endOfYear.setHours(23, 59, 59, 999);

    const yearlySalesData = await getSalesData(startOfYear, endOfYear);
    yearlySales.push(yearlySalesData);
  }

  return yearlySales;
};

const loadDashboard = async (req, res) => {
  try {
    const totalOrders = await Order.aggregate([
      { $count: 'total' } 
    ]);
    
    const totalOrdersCount = totalOrders.length ? totalOrders[0].total : 0;

    const totalUsers = await User.aggregate([
      { $match: { role: 'user' } },
      { $count: 'total' } 
    ]);
    
   
    const totalUsersCount = totalUsers.length ? totalUsers[0].total : 0;

    const getTotalRevenue = async () => {
      const result = await Order.aggregate([
        { $group: { _id: null, total: { $sum: '$totalAmount' } } },
      ]);
    
      return result.length ? result[0].total : 0; 
    };

    const totalRevenue = await getTotalRevenue(); 
    const today = new Date();
   console.log("totalOrdersPromise",totalOrders);
   

    const dailySales = [];
    for (let i = 6; i >= 0; i--) {
      let startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      startOfDay.setDate(today.getDate() - i);
      let endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);
      
      const daySales = await getSalesData(startOfDay, endOfDay);
      dailySales.push({
        date: startOfDay.toDateString(),
        totalOrders: daySales.totalOrders,
        totalRevenue: daySales.totalRevenue,
        totalCouponDiscount: daySales.totalCouponDiscount,
        totalProductDiscount: daySales.totalProductDiscount,
      });
    }
     

    const weeklySales = await getWeeklySales();
    const monthlySales = await getMonthlySales();
    const yearlySales = await getYearlySales();

    return res.render('admin/dashboard', {
      totalUsers: totalUsersCount,
      totalOrders: totalOrdersCount,
      totalRevenue: totalRevenue,
      dailySales,
      weeklySales,
      monthlySales,
      yearlySales,
    });
  } catch (error) {
    console.error('Error loading dashboard:', error);
    res.status(500).send('Server Error');
  }
};











const downloadSalesPDF = async (req, res) => {
  try {
    const { startDate, endDate, format } = req.query; 
    const salesData = await getSalesData(new Date(startDate), new Date(endDate));

    if (format === 'pdf') {
      // Generate PDF
      const doc = new PDFDocument();
      let filename = `Sales_Report_${startDate}_to_${endDate}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

      doc.pipe(res);

      doc.fontSize(20).text('Sales Report', { align: 'center' });
      doc.moveDown();

      // Table headers
      doc.text('Date/Period | Total Orders | Total Revenue | Total Coupon Discount | Total Product Discount');
      doc.moveDown();

      // Add sales data row
      const saleRow = `${startDate} - ${endDate} | ${salesData.totalOrders} | $${salesData.totalRevenue.toFixed(2)} | $${salesData.totalCouponDiscount.toFixed(2)} | $${salesData.totalProductDiscount.toFixed(2)}`;
      doc.text(saleRow);

      doc.end();
    } else if (format === 'excel') {
      // Generate Excel
      const wb = new ExcelJS.Workbook();
      const ws = wb.addWorksheet('Sales Report');

      ws.addRow(['Date/Period', 'Total Orders', 'Total Revenue', 'Total Coupon Discount', 'Total Product Discount']);

      ws.addRow([
        `${startDate} - ${endDate}`, 
        salesData.totalOrders,
        salesData.totalRevenue.toFixed(2),
        salesData.totalCouponDiscount.toFixed(2),
        salesData.totalProductDiscount.toFixed(2),
      ]);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename="Sales_Report.xlsx"');

      await wb.xlsx.write(res);
      res.end();
    } else {
      res.status(400).send('Invalid format. Please specify either pdf or excel.');
    }
  } catch (error) {
    console.error(error);
    res.status(500).send('Error generating report');
  }
};


const adminLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

module.exports = { loadLogin, login, loadDashboard, adminLogout ,downloadSalesPDF};
