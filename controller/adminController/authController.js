const User = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const Coupon = require("../../models/couponmodel");
const Product = require("../../models/productmodel")
const bcrypt = require("bcrypt");
const PDFDocument = require("pdfkit");
const ExcelJS = require("exceljs");
const fs = require("fs");
const path = require("path");
const { log } = require("console");



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
  const orders = await Order.find({ createdAt: { $gte: startDate, $lt: endDate } })
    .populate('customerId')
    .populate('coupon')
    .populate('items.productId');
console.log("orders?.items?",orders);

  let totalOrders =orders.reduce((acc, order) => acc + order.items.length, 0)
  let totalRevenue = 0;
  let totalCouponDiscount = 0;
  let totalProductDiscount = 0;

  orders.forEach(order => {
    totalRevenue += order.totalAmount;
    if (order.coupon) totalCouponDiscount += order.coupon.discountValue;

    order.items.forEach(item => {
      const productPrice = parseFloat(item.productId.price.replace(/,/g, ''));
      const offerPercentage = item.productId.offer ? parseFloat(item.productId.offer) / 100 : 0;
      totalProductDiscount += offerPercentage * productPrice;
    });
  });

  return totalOrders > 0 ? { totalOrders, totalRevenue, totalCouponDiscount, totalProductDiscount } : null;
};


const getDailySales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const dailySales = [];

  // Get today's date in UTC
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);

  // Add a console.log to debug
  console.log('Initial today:', today);

  // Look back 31 days to ensure we get enough data
  for (let i = 0; i < 31; i++) {
    const startOfDay = new Date(today);
    startOfDay.setDate(today.getDate() - i);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setUTCHours(23, 59, 59, 999);

    // Add console.logs for debugging
    console.log(`Day ${i}:`, startOfDay, 'to', endOfDay);

    const salesData = await getSalesData(startOfDay, endOfDay);
    if (salesData) {
      dailySales.push({
        date: startOfDay.toISOString().split('T')[0],
        daysAgo: i,
        ...salesData
      });
    }
  }

  // Log the length of dailySales before sorting
  console.log('Total daily sales before sorting:', dailySales.length);

  // Sort by date in descending order (most recent first)
  dailySales.sort((a, b) => new Date(b.date) - new Date(a.date));

  // Calculate total pages
  const totalPages = Math.ceil(dailySales.length / limit);

  // Get the slice of data for the current page
  const paginatedData = dailySales.slice(skip, skip + limit);

  // Log final data
  console.log('Paginated data length:', paginatedData.length);
  console.log('Skip:', skip);
  console.log('Limit:', limit);

  return {
    data: paginatedData,
    totalPages: totalPages,
  };
};

const getWeeklySales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const firstOrder = await Order.findOne().sort({ createdAt: 1 });
  if (!firstOrder) return [];

  const startDate = new Date(firstOrder.createdAt);
  const endDate = new Date();
  const weeklySales = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 7)) {
    let startOfWeek = new Date(d);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    const salesData = await getSalesData(startOfWeek, endOfWeek);
    if (salesData) {
      weeklySales.push({ startDate: startOfWeek.toDateString(), endDate: endOfWeek.toDateString(), ...salesData });
    }
  }

  weeklySales.sort((a, b) => new Date(b.startDate) - new Date(a.startDate));

  return {
    data: weeklySales.slice(skip, skip + limit),
    totalPages: Math.ceil(weeklySales.length / limit),
  };
};



const getMonthlySales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const firstOrder = await Order.findOne().sort({ createdAt: 1 });
  if (!firstOrder) return { data: [], totalPages: 0 };

  const startDate = new Date(firstOrder.createdAt);
  const endDate = new Date();
  const monthlySales = [];

  for (let d = new Date(startDate); d <= endDate; d.setMonth(d.getMonth() + 1)) {
    let startOfMonth = new Date(d.getFullYear(), d.getMonth(), 1, 0, 0, 0, 0);
    let endOfMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);

    const salesData = await getSalesData(startOfMonth, endOfMonth);
    if (salesData) {
      monthlySales.push({
        year: startOfMonth.getFullYear(),
        month: startOfMonth.getMonth() + 1,
        ...salesData,
      });
    }
  }

  monthlySales.sort((a, b) => new Date(b.year, b.month - 1) - new Date(a.year, a.month - 1));

  return {
    data: monthlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(monthlySales.length / limit),
  };
};

const getYearlySales = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  const firstOrder = await Order.findOne().sort({ createdAt: 1 });
  if (!firstOrder) return { data: [], totalPages: 0 };

  const startYear = firstOrder.createdAt.getFullYear();
  const currentYear = new Date().getFullYear();
  const yearlySales = [];

  for (let year = startYear; year <= currentYear; year++) {
    let startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
    let endOfYear = new Date(year + 1, 0, 1, 0, 0, 0, -1);

    const salesData = await getSalesData(startOfYear, endOfYear);
    if (salesData) {
      yearlySales.push({ year, ...salesData });
    }
  }

  yearlySales.sort((a, b) => b.year - a.year);

  return {
    data: yearlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(yearlySales.length / limit),
  };
};

const loadDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const orders = await Order.find({})

    const [totalOrdersData, totalUsersData, totalRevenueData, dailySalesData, weeklySalesData, monthlySalesData, yearlySalesData] = await Promise.all([
      Order.aggregate([{ $count: 'total' }]),
      User.aggregate([{ $match: { role: 'user' } }, { $count: ' ' }]),
      Order.aggregate([{ $group: { _id: null, total: { $sum: '$totalAmount' } } }]),
      getDailySales(page, limit),
      getWeeklySales(page, limit),
      getMonthlySales(page, limit),
      getYearlySales(page, limit),
    ]);

    const totalOrders = orders.reduce((acc, order) => acc + order.items.length, 0)
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalRevenue = totalRevenueData.length ? totalRevenueData[0].total : 0;

    return res.render('admin/dashboard', {
      totalUsers,
      totalOrders,
      totalRevenue,

      dailySales: dailySalesData.data,
      weeklySales: weeklySalesData.data,
      monthlySales: monthlySalesData.data,
      yearlySales: yearlySalesData.data,

      currentPage: page,
      totalPages: {
        daily: Math.max(dailySalesData.totalPages, 1),
        weekly: Math.max(weeklySalesData.totalPages, 1),
        monthly: Math.max(monthlySalesData.totalPages, 1),
        yearly: Math.max(yearlySalesData.totalPages, 1),
      },
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
