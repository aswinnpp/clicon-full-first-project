const User = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const Coupon = require("../../models/couponmodel");
const Return = require('../../models/productreturn');
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
  const orders = await Order.find({ 
    createdAt: { 
      $gte: new Date(startDate),
      $lte: new Date(endDate)
    }
  })
  .populate('customerId')
  .populate('coupon')
  .populate('items.productId');

  if (!orders.length) return null;

  let totalOrders = await Order.aggregate([
    {
      $match: {
        createdAt: { 
          $gte: new Date(startDate),
          $lte: new Date(endDate)
        }
      }
    },
    { $unwind: "$items" },
    { $group: { _id: null, total: { $sum: 1 } } }
  ]).then(result => result.length ? result[0].total : 0);

  let totalProductCount = 0;
  let totalDeliveredProducts = 0;
  let totalRevenue = 0;
  let totalCouponDiscount = 0;
  let totalProductDiscount = 0;

  orders.forEach(order => {
    order.items.forEach(item => {
      if (item.quantity && item.shippingDetails && item.shippingDetails.status === 'Delivered') {
        totalProductCount += item.quantity;
        totalDeliveredProducts += item.quantity;
        
        const productPrice = parseFloat(item.productId.price.replace(/,/g, ''));
        const offerPercentage = item.productId.offer ? parseFloat(item.productId.offer) / 100 : 0;
        
        totalRevenue += Math.floor((productPrice - (productPrice * offerPercentage)) * item.quantity);
        totalProductDiscount += Math.floor(offerPercentage * productPrice * item.quantity);
      }
    });

    if (order.coupon) {
      totalCouponDiscount += Math.floor(order.couponDiscount || 0);
    }
  });

  return { 
    totalOrders: Math.floor(totalOrders),
    totalProductCount: Math.floor(totalProductCount),
    totalDeliveredProducts: Math.floor(totalDeliveredProducts),
    totalRevenue: Math.floor(totalRevenue),
    totalCouponDiscount: Math.floor(totalCouponDiscount),
    totalProductDiscount: Math.floor(totalProductDiscount)
  };
};

const getDailySales = async (page = 1, limit = 10, startDate = null, endDate = null) => {
  const skip = (page - 1) * limit;
  const dailySales = [];

  let queryStartDate = startDate ? new Date(startDate) : await Order.findOne().sort({ createdAt: 1 }).then(order => order?.createdAt);
  let queryEndDate = endDate ? new Date(endDate) : new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  queryStartDate = new Date(queryStartDate.setHours(0, 0, 0, 0));
  queryEndDate = new Date(queryEndDate.setHours(23, 59, 59, 999));

  for (let d = new Date(queryStartDate); d <= queryEndDate; d.setDate(d.getDate() + 1)) {
    const dayStart = new Date(d);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const salesData = await getSalesData(dayStart, dayEnd);
    if (salesData) {
      dailySales.push({
        date: dayStart.toISOString().split('T')[0],
        ...salesData
      });
    }
  }

  dailySales.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    data: dailySales.slice(skip, skip + limit),
    totalPages: Math.ceil(dailySales.length / limit)
  };
};

const getWeeklySales = async (page = 1, limit = 10, startDate = null, endDate = null) => {
  const skip = (page - 1) * limit;
  
  const queryStartDate = startDate || await Order.findOne().sort({ createdAt: 1 }).then(order => order?.createdAt);
  const queryEndDate = endDate || new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  const start = new Date(queryStartDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(queryEndDate);
  end.setHours(23, 59, 59, 999);

  const weeklySales = [];

  const hasOrders = await Order.findOne({
    createdAt: { 
      $gte: start,
      $lte: end
    }
  });

  if (!hasOrders) {
    return {
      data: [],
      totalPages: 0
    };
  }

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 7)) {
    let startOfWeek = new Date(d);
    startOfWeek.setUTCHours(0, 0, 0, 0);
    let endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(startOfWeek.getDate() + 6);
    endOfWeek.setUTCHours(23, 59, 59, 999);

    const salesData = await getSalesData(startOfWeek, endOfWeek);
    if (salesData) {
      weeklySales.push({ 
        startDate: startOfWeek.toDateString(), 
        endDate: endOfWeek.toDateString(), 
        ...salesData 
      });
    }
  }

  return {
    data: weeklySales.slice(skip, skip + limit),
    totalPages: Math.ceil(weeklySales.length / limit),
  };
};

const getMonthlySales = async (page = 1, limit = 10, startDate = null, endDate = null) => {
  const skip = (page - 1) * limit;
  
  const queryStartDate = startDate || await Order.findOne().sort({ createdAt: 1 }).then(order => order?.createdAt);
  const queryEndDate = endDate || new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  const start = new Date(queryStartDate);
  start.setHours(0, 0, 0, 0);
  
  const end = new Date(queryEndDate);
  end.setHours(23, 59, 59, 999);

  const hasOrders = await Order.findOne({
    createdAt: { 
      $gte: start,
      $lte: end
    }
  });

  if (!hasOrders) {
    return {
      data: [],
      totalPages: 0
    };
  }

  const monthlySales = [];

  for (let d = new Date(start); d <= end; d.setMonth(d.getMonth() + 1)) {
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

  return {
    data: monthlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(monthlySales.length / limit),
  };
};

const getYearlySales = async (page = 1, limit = 10, startDate = null, endDate = null) => {
  const skip = (page - 1) * limit;
  
  const queryStartDate = startDate || await Order.findOne().sort({ createdAt: 1 }).then(order => order?.createdAt);
  const queryEndDate = endDate || new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  const startYear = new Date(queryStartDate).getFullYear();
  const endYear = new Date(queryEndDate).getFullYear();
  const yearlySales = [];

  const hasOrders = await Order.findOne({
    createdAt: { 
      $gte: new Date(startYear, 0, 1),
      $lte: new Date(endYear, 11, 31, 23, 59, 59, 999)
    }
  });

  if (!hasOrders) {
    console.log('No orders found in year range');
    return {
      data: [],
      totalPages: 0
    };
  }

  for (let year = startYear; year <= endYear; year++) {
    let startOfYear = new Date(year, 0, 1, 0, 0, 0, 0);
    let endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    if (year === startYear && startDate) {
      startOfYear = new Date(startDate);
    }
    if (year === endYear && endDate) {
      endOfYear = new Date(endDate);
    }

    const salesData = await getSalesData(startOfYear, endOfYear);
    if (salesData && (salesData.totalOrders > 0 || salesData.totalProductCount > 0)) {
      yearlySales.push({ 
        year, 
        startDate: startOfYear.toISOString().split('T')[0],
        endDate: endOfYear.toISOString().split('T')[0],
        ...salesData 
      });
    }
  }

  yearlySales.sort((a, b) => b.year - a.year);

  console.log('Yearly Sales Found:', {
    startYear,
    endYear,
    dataFound: yearlySales.length > 0,
    numberOfYears: yearlySales.length
  });

  if (yearlySales.length === 0) {
    return {
      data: [],
      totalPages: 0
    };
  }

  return {
    data: yearlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(yearlySales.length / limit),
  };
};



const loadDashboard = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const skip = (page - 1) * limit;
    
    let startDate = null;
    let endDate = null;
    
    if (req.query.startDate && req.query.endDate) {
      startDate = new Date(req.query.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      endDate = new Date(req.query.endDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const [dailySalesData, weeklySalesData, monthlySalesData, yearlySalesData] = await Promise.all([
      getDailySales(page, limit, startDate, endDate),
      getWeeklySales(page, limit, startDate, endDate),
      getMonthlySales(page, limit, startDate, endDate),
      getYearlySales(page, limit, startDate, endDate)
    ]);

    console.log('Sales Data Status:', {
      hasDaily: dailySalesData.data.length > 0,
      hasYearly: yearlySalesData.data.length > 0,
      yearlyData: yearlySalesData
    });

    if (!dailySalesData.data || dailySalesData.data.length === 0) {
      const emptyData = {
        data: [],
        totalPages: 0
      };

      return res.render('admin/dashboard', {
        totalUsers: await User.countDocuments({ role: "user" }),
        totalOrders: 0,
        totalProducts: 0,
        totalDeliveredProducts: 0,
        totalRevenue: 0,
        totalReturns: 0,
        orders: [],
        currentPage: {
          daily: page,
          weekly: page,
          monthly: page,
          yearly: page
        },
        totalPages: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0
        },
        dailySales: [],
        weeklySales: [],
        monthlySales: [],
        yearlySales: [],
        startDate: startDate ? startDate.toISOString().split('T')[0] : '',
        endDate: endDate ? endDate.toISOString().split('T')[0] : ''
      });
    }

    let orderQuery = {};
    if (startDate && endDate) {
      orderQuery.createdAt = {
        $gte: startDate,
        $lte: endDate
      };
    }

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalReturns = await Return.countDocuments(orderQuery);

    const totalOrdersCount = await Order.aggregate([
      {
        $match: orderQuery
      },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: 1 } } }
    ]).then(result => result.length ? result[0].total : 0);

    const totalProducts = await Order.aggregate([
      {
        $match: orderQuery
      },
      { $unwind: "$items" },
      { 
        $group: { 
          _id: null, 
          totalProducts: { $sum: "$items.quantity" } 
        } 
      }
    ]).then(result => result.length ? result[0].totalProducts : 0);

    const totalDeliveredProducts = await Order.aggregate([
      {
        $match: {
          ...orderQuery,
          'items.shippingDetails.status': 'Delivered'
        }
      },
      { $unwind: '$items' },
      {
        $match: {
          'items.shippingDetails.status': 'Delivered'
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$items.quantity' }
        }
      }
    ]).then(result => result.length ? result[0].total : 0);

    const orders = await Order.find(orderQuery).populate('items.productId').populate('coupon');
    let totalRevenue = 0;
    let totalProductDiscount = 0;
    let totalCouponDiscount = 0;

    orders.forEach(order => {
      order.items.forEach(item => {
        if (item.shippingDetails && item.shippingDetails.status === 'Delivered') {
          const productPrice = parseFloat(item.productId.price.replace(/,/g, ''));
          const quantity = item.quantity || 1;
          const offerPercentage = item.productId.offer ? parseFloat(item.productId.offer) / 100 : 0;
          
          totalRevenue += Math.floor((productPrice - (productPrice * offerPercentage)) * quantity);
          totalProductDiscount += Math.floor(offerPercentage * productPrice * quantity);

          if (order.coupon) {
            totalCouponDiscount += Math.floor((order.couponDiscount || 0) / order.items.length);
          }
        }
      });
    });

    return res.render('admin/dashboard', {
      totalUsers,
      totalOrders: totalOrdersCount,
      totalProducts,
      totalDeliveredProducts,
      totalRevenue,
      totalReturns,
      orders,
      currentPage: {
        daily: page,
        weekly: page,
        monthly: page,
        yearly: page
      },
      totalPages: {
        daily: dailySalesData.totalPages,
        weekly: weeklySalesData.totalPages,
        monthly: monthlySalesData.totalPages,
        yearly: yearlySalesData.totalPages
      },
      dailySales: dailySalesData.data,
      weeklySales: weeklySalesData.data,
      monthlySales: monthlySalesData.data,
      yearlySales: yearlySalesData.data,
      startDate: startDate ? startDate.toISOString().split('T')[0] : '',
      endDate: endDate ? endDate.toISOString().split('T')[0] : ''
    });
  } catch (error) {
    console.error("Dashboard loading error:", error);
    res.status(500).send("Server Error");
  }
};




const adminLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

module.exports = { loadLogin, login, loadDashboard, adminLogout };