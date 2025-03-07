const User = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const Coupon = require("../../models/couponmodel");
const Return = require("../../models/productreturn");
const Product = require("../../models/productmodel");
const moment = require("moment");
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
      $lte: new Date(endDate),
    },
  })
    .populate("customerId")
    .populate("items.productId");

  if (!orders.length) return null;

  let totalOrders = await Order.aggregate([
    {
      $match: {
        createdAt: {
          $gte: new Date(startDate),
          $lte: new Date(endDate),
        },
      },
    },
    { $unwind: "$items" },
    { $group: { _id: null, total: { $sum: 1 } } },
  ]).then((result) => (result.length ? result[0].total : 0));

  let totalProductCount = 0;
  let totalDeliveredProducts = 0;
  let totalRevenue = 0;
  let totalCouponDiscount = 0;
  let totalProductDiscount = 0;

  orders.forEach((order) => {
    order.items.forEach((item) => {
      if (
        item.quantity &&
        item.shippingDetails &&
        item.shippingDetails.status === "Delivered"
      ) {
        totalProductCount += item.quantity;
        totalDeliveredProducts += item.quantity;

        const productPrice = parseFloat(item.productId.price.replace(/,/g, ""));
        const offerPercentage = item.productId.offer
          ? parseFloat(item.productId.offer) / 100
          : 0;
        const couponDiscount = item.coupons ? parseFloat(item.coupons) : 0; 

        const discountedPrice = productPrice - productPrice * offerPercentage;
        totalRevenue += Math.floor(
          (discountedPrice - couponDiscount) * item.quantity
        );
        totalProductDiscount += Math.floor(
          offerPercentage * productPrice * item.quantity
        );
        totalCouponDiscount += Math.floor(couponDiscount * item.quantity);
      }
    });
  });

  return {
    totalOrders: Math.floor(totalOrders),
    totalProductCount: Math.floor(totalProductCount),
    totalDeliveredProducts: Math.floor(totalDeliveredProducts),
    totalRevenue: Math.floor(totalRevenue),
    totalCouponDiscount: Math.floor(totalCouponDiscount),
    totalProductDiscount: Math.floor(totalProductDiscount),
  };
};

const getDailySales = async (
  page = 1,
  limit = 10,
  startDate = null,
  endDate = null
) => {
  const skip = (page - 1) * limit;
  const dailySales = [];

  let queryStartDate = startDate
    ? new Date(startDate)
    : await Order.findOne()
        .sort({ createdAt: 1 })
        .then((order) => order?.createdAt);
  let queryEndDate = endDate ? new Date(endDate) : new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  queryStartDate = new Date(queryStartDate.setHours(0, 0, 0, 0));
  queryEndDate = new Date(queryEndDate.setHours(23, 59, 59, 999));

  for (
    let d = new Date(queryStartDate);
    d <= queryEndDate;
    d.setDate(d.getDate() + 1)
  ) {
    const dayStart = new Date(d);
    const dayEnd = new Date(d);
    dayEnd.setHours(23, 59, 59, 999);

    const salesData = await getSalesData(dayStart, dayEnd);
    if (salesData) {
      dailySales.push({
        date: dayStart.toLocaleDateString("en-CA"),
        ...salesData,
      });
    }
  }

  dailySales.sort((a, b) => new Date(b.date) - new Date(a.date));

  return {
    data: dailySales.slice(skip, skip + limit),
    totalPages: Math.ceil(dailySales.length / limit),
  };
};

const getWeeklySales = async (
  page = 1,
  limit = 10,
  startDate = null,
  endDate = null
) => {
  const skip = (page - 1) * limit;

  const queryStartDate =
    startDate ||
    (await Order.findOne()
      .sort({ createdAt: 1 })
      .then((order) => order?.createdAt));
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
      $lte: end,
    },
  });

  if (!hasOrders) {
    return {
      data: [],
      totalPages: 0,
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
        ...salesData,
      });
    }
  }

  return {
    data: weeklySales.slice(skip, skip + limit),
    totalPages: Math.ceil(weeklySales.length / limit),
  };
};

const getMonthlySales = async (
  page = 1,
  limit = 10,
  startDate = null,
  endDate = null
) => {
  const skip = (page - 1) * limit;

  const queryStartDate =
    startDate ||
    (await Order.findOne()
      .sort({ createdAt: 1 })
      .then((order) => order?.createdAt));
  const queryEndDate = endDate || new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  const start = new Date(queryStartDate);
  start.setHours(0, 0, 0, 0);

  const end = new Date(queryEndDate);
  end.setHours(23, 59, 59, 999);

  const hasOrders = await Order.findOne({
    createdAt: {
      $gte: start,
      $lte: end,
    },
  });

  if (!hasOrders) {
    return {
      data: [],
      totalPages: 0,
    };
  }

  const monthlySales = [];

  for (let year = start.getFullYear(); year <= end.getFullYear(); year++) {
    const startMonth = year === start.getFullYear() ? start.getMonth() : 0;
    const endMonth = year === end.getFullYear() ? end.getMonth() : 11;

    for (let month = startMonth; month <= endMonth; month++) {
      let startOfMonth = new Date(year, month, 1, 0, 0, 0, 0);
      let endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);

      console.log(`Fetching sales for ${year}-${month + 1}`);

      const salesData = await getSalesData(startOfMonth, endOfMonth);

      if (salesData) {
        monthlySales.push({
          year,
          month: month + 1,
          ...salesData,
        });
      }
    }
  }

  console.log("monthlySalesData", monthlySales);
  return {
    data: monthlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(monthlySales.length / limit),
  };
};

const getYearlySales = async (
  page = 1,
  limit = 10,
  startDate = null,
  endDate = null
) => {
  const skip = (page - 1) * limit;

  const queryStartDate =
    startDate ||
    (await Order.findOne()
      .sort({ createdAt: 1 })
      .then((order) => order?.createdAt));
  const queryEndDate = endDate || new Date();

  if (!queryStartDate) return { data: [], totalPages: 0 };

  const startYear = new Date(queryStartDate).getFullYear();
  const endYear = new Date(queryEndDate).getFullYear();
  const yearlySales = [];

  const hasOrders = await Order.findOne({
    createdAt: {
      $gte: new Date(startYear, 0, 1),
      $lte: new Date(endYear, 11, 31, 23, 59, 59, 999),
    },
  });

  if (!hasOrders) {
    console.log("No orders found in year range");
    return {
      data: [],
      totalPages: 0,
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
    if (
      salesData &&
      (salesData.totalOrders > 0 || salesData.totalProductCount > 0)
    ) {
      yearlySales.push({
        year,
        startDate: startOfYear.toISOString().split("T")[0],
        endDate: endOfYear.toISOString().split("T")[0],
        ...salesData,
      });
    }
  }

  yearlySales.sort((a, b) => b.year - a.year);

  console.log("Yearly Sales Found:", {
    startYear,
    endYear,
    dataFound: yearlySales.length > 0,
    numberOfYears: yearlySales.length,
  });

  if (yearlySales.length === 0) {
    return {
      data: [],
      totalPages: 0,
    };
  }

  return {
    data: yearlySales.slice(skip, skip + limit),
    totalPages: Math.ceil(yearlySales.length / limit),
  };
};

const loadSales = async (req, res) => {
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

    const [dailySalesData, weeklySalesData, monthlySalesData, yearlySalesData] =
      await Promise.all([
        getDailySales(page, limit, startDate, endDate),
        getWeeklySales(page, limit, startDate, endDate),
        getMonthlySales(page, limit, startDate, endDate),
        getYearlySales(page, limit, startDate, endDate),
      ]);

    console.log("Sales Data Status:", {
      hasDaily: dailySalesData.data.length > 0,
      hasYearly: yearlySalesData.data.length > 0,
      yearlyData: yearlySalesData,
    });

    if (!dailySalesData.data || dailySalesData.data.length === 0) {
      const emptyData = {
        data: [],
        totalPages: 0,
      };

      return res.render("admin/saleseReport", {
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
          yearly: page,
        },
        totalPages: {
          daily: 0,
          weekly: 0,
          monthly: 0,
          yearly: 0,
        },
        dailySales: [],
        weeklySales: [],
        monthlySales: [],
        yearlySales: [],
        startDate: startDate ? startDate.toISOString().split("T")[0] : "",
        endDate: endDate ? endDate.toISOString().split("T")[0] : "",
      });
    }

    let orderQuery = {};
    if (startDate && endDate) {
      orderQuery.createdAt = {
        $gte: startDate,
        $lte: endDate,
      };
    }

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalReturns = await Return.countDocuments(orderQuery);

    const totalOrdersCount = await Order.aggregate([
      {
        $match: orderQuery,
      },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]).then((result) => (result.length ? result[0].total : 0));

    const totalProducts = await Order.aggregate([
      {
        $match: orderQuery,
      },
      { $unwind: "$items" },
      {
        $group: {
          _id: null,
          totalProducts: { $sum: "$items.quantity" },
        },
      },
    ]).then((result) => (result.length ? result[0].totalProducts : 0));

    const totalDeliveredProducts = await Order.aggregate([
      {
        $match: {
          ...orderQuery,
          "items.shippingDetails.status": "Delivered",
        },
      },
      { $unwind: "$items" },
      {
        $match: {
          "items.shippingDetails.status": "Delivered",
        },
      },
      {
        $group: {
          _id: null,
          total: { $sum: "$items.quantity" },
        },
      },
    ]).then((result) => (result.length ? result[0].total : 0));

    const orders = await Order.find(orderQuery)
      .populate("items.productId")
      .populate("coupon");
    let totalRevenue = 0;
    let totalProductDiscount = 0;
    let totalCouponDiscount = 0;

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.shippingDetails &&
          item.shippingDetails.status === "Delivered"
        ) {
          const productPrice = parseFloat(
            item.productId.price.replace(/,/g, "")
          );
          const quantity = item.quantity || 1;
          const offerPercentage = item.productId.offer
            ? parseFloat(item.productId.offer) / 100
            : 0;

          totalRevenue += Math.floor(
            (productPrice - productPrice * offerPercentage) * quantity
          );
          totalProductDiscount += Math.floor(
            offerPercentage * productPrice * quantity
          );

          if (item.coupons) {
            totalCouponDiscount += item.coupons;
          }
        }
      });
    });

    return res.render("admin/saleseReport", {
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
        yearly: page,
      },
      totalPages: {
        daily: dailySalesData.totalPages,
        weekly: weeklySalesData.totalPages,
        monthly: monthlySalesData.totalPages,
        yearly: yearlySalesData.totalPages,
      },
      dailySales: dailySalesData.data,
      weeklySales: weeklySalesData.data,
      monthlySales: monthlySalesData.data,
      yearlySales: yearlySalesData.data,
      startDate: startDate ? startDate.toISOString().split("T")[0] : "",
      endDate: endDate ? endDate.toISOString().split("T")[0] : "",
    });
  } catch (error) {
    console.error("Dashboard loading error:", error);
    res.status(500).send("Server Error");
  }
};

const loadDashboardGraph = async (req, res) => {
  try {
    let { startDate, endDate } = req.query;

    const deliveredOrders = await Order.find({
      "items.shippingDetails.status": "Delivered",
    }).populate("items.productId", "productname category brand rating price");

    const productSales = {};
    const categorySales = {};
    const brandSales = {};

    deliveredOrders.forEach((order) => {
      order.items.forEach((item) => {
        const product = item.productId;
        if (!product) return;

        const productId = product._id.toString();
        const category = product.category;

        const brand = product.brand;

        if (!productSales[productId]) {
          productSales[productId] = {
            productname: product.productname,
            category: category,
            brand: brand,
            rating: product.rating || "N/A",
            totalSold: 0,
            revenue: 0,
          };
        }
        productSales[productId].totalSold += item.quantity;
        productSales[productId].revenue +=
          item.quantity * parseFloat(product.price.replace(/,/g, ""));

        if (!categorySales[category]) {
          categorySales[category] = { totalSold: 0 };
        }
        categorySales[category].totalSold += item.quantity;

        if (!brandSales[brand]) {
          brandSales[brand] = { totalSold: 0 };
        }
        brandSales[brand].totalSold += item.quantity;
      });
    });

    const sortedProducts = Object.values(productSales)
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    const sortedCategories = Object.entries(categorySales)
      .map(([category, data]) => ({ category, totalSold: data.totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    const sortedBrands = Object.entries(brandSales)
      .map(([brand, data]) => ({ brand, totalSold: data.totalSold }))
      .sort((a, b) => b.totalSold - a.totalSold)
      .slice(0, 10);

    const firstOrder = await Order.findOne().sort({ createdAt: 1 });

    if (!firstOrder) {
      return res.render("admin/dashboardgraph", {
        totals: {},
        selectedDates: { startDate, endDate },
        graphData: { daily: {}, weekly: {}, monthly: {}, yearly: {} },
      });
    }

    const firstOrderDate = new Date(firstOrder.createdAt);
    startDate = startDate ? new Date(startDate) : firstOrderDate;
    startDate.setHours(0, 0, 0, 0);
    endDate = endDate ? new Date(endDate) : new Date();
    endDate.setHours(23, 59, 59, 999);

    let orderQuery = { createdAt: { $gte: startDate, $lte: endDate } };
    const orders = await Order.find(orderQuery)
      .populate("items.productId")
      .populate("coupon");

    let totalRevenue = 0;
    let totalProductDiscount = 0;
    let totalCouponDiscount = 0;

    let dailyData = {};
    let weeklyData = {};
    let monthlyData = {};
    let yearlyData = {};

    orders.forEach((order) => {
      order.items.forEach((item) => {
        if (
          item.shippingDetails &&
          item.shippingDetails.status === "Delivered"
        ) {
          const productPrice = parseFloat(
            item.productId.price.replace(/,/g, "")
          );
          const quantity = item.quantity || 1;

          console.log("quantity", quantity);

          const offerPercentage = item.productId.offer
            ? parseFloat(item.productId.offer) / 100
            : 0;

          const itemRevenue = Math.floor(
            (productPrice - productPrice * offerPercentage) * quantity
          );
          const itemProductDiscount = Math.floor(
            offerPercentage * productPrice * quantity
          );

          totalRevenue += itemRevenue;
          totalProductDiscount += itemProductDiscount;

          if (item.coupons) {
            totalCouponDiscount += item.coupons;
          }

          const orderDate = new Date(order.createdAt);
          const day = orderDate.toISOString().split("T")[0];
          const week = `${orderDate.getFullYear()}-W${moment(
            orderDate
          ).isoWeek()}`;
          const month = `${orderDate.getFullYear()}-${String(
            orderDate.getMonth() + 1
          ).padStart(2, "0")}`;
          const year = orderDate.getFullYear().toString();

          if (!dailyData[day]) dailyData[day] = { revenue: 0, orders: 0 };
          dailyData[day].revenue += itemRevenue;
          dailyData[day].orders += quantity;

          if (!weeklyData[week]) weeklyData[week] = { revenue: 0, orders: 0 };
          weeklyData[week].revenue += itemRevenue;
          weeklyData[week].orders += quantity;

          if (!monthlyData[month])
            monthlyData[month] = { revenue: 0, orders: 0 };
          monthlyData[month].revenue += itemRevenue;
          monthlyData[month].orders += quantity;

          if (!yearlyData[year]) yearlyData[year] = { revenue: 0, orders: 0 };
          yearlyData[year].revenue += itemRevenue;
          yearlyData[year].orders += quantity;
        }
      });
    });

    const totalUsers = await User.countDocuments({ role: "user" });
    const totalReturns = await Return.countDocuments(orderQuery);

    const totalOrdersCount = await Order.aggregate([
      { $match: orderQuery },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: 1 } } },
    ]).then((result) => (result.length ? result[0].total : 0));

    const totalProducts = await Order.aggregate([
      { $match: orderQuery },
      { $unwind: "$items" },
      { $group: { _id: null, totalProducts: { $sum: "$items.quantity" } } },
    ]).then((result) => (result.length ? result[0].totalProducts : 0));

    const totalDeliveredProducts = await Order.aggregate([
      {
        $match: { ...orderQuery, "items.shippingDetails.status": "Delivered" },
      },
      { $unwind: "$items" },
      { $match: { "items.shippingDetails.status": "Delivered" } },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]).then((result) => (result.length ? result[0].total : 0));

    const graphData = {
      daily: {
        labels: Object.keys(dailyData).sort(),
        revenue: Object.keys(dailyData)
          .sort()
          .map((day) => dailyData[day].revenue),
        orders: Object.keys(dailyData)
          .sort()
          .map((day) => dailyData[day].orders),
      },
      weekly: {
        labels: Object.keys(weeklyData)
          .sort((a, b) => {
            const [yearA, weekA] = a.split("-W").map(Number);
            const [yearB, weekB] = b.split("-W").map(Number);
            return yearA - yearB || weekA - weekB;
          })
          .map((week) => {
            const [year, weekNum] = week.split("-W").map(Number);
            const startOfWeek = moment()
              .year(year)
              .week(weekNum)
              .startOf("isoWeek")
              .format("YYYY/MM/DD");
            const endOfWeek = moment()
              .year(year)
              .week(weekNum)
              .endOf("isoWeek")
              .format("YYYY/MM/DD");
            return `${startOfWeek} - ${endOfWeek}`;
          }),

        revenue: Object.keys(weeklyData)
          .sort((a, b) => {
            const [yearA, weekA] = a.split("-W").map(Number);
            const [yearB, weekB] = b.split("-W").map(Number);
            return yearA - yearB || weekA - weekB;
          })
          .map((week) => weeklyData[week].revenue),

        orders: Object.keys(weeklyData)
          .sort((a, b) => {
            const [yearA, weekA] = a.split("-W").map(Number);
            const [yearB, weekB] = b.split("-W").map(Number);
            return yearA - yearB || weekA - weekB;
          })
          .map((week) => weeklyData[week].orders),
      },
      monthly: {
        labels: Object.keys(monthlyData).sort(),
        revenue: Object.keys(monthlyData)
          .sort()
          .map((month) => monthlyData[month].revenue),
        orders: Object.keys(monthlyData)
          .sort()
          .map((month) => monthlyData[month].orders),
      },
      yearly: {
        labels: Object.keys(yearlyData).sort((a, b) => a - b),
        revenue: Object.keys(yearlyData)
          .sort((a, b) => a - b)
          .map((year) => yearlyData[year].revenue),
        orders: Object.keys(yearlyData)
          .sort((a, b) => a - b)
          .map((year) => yearlyData[year].orders),
      },
    };

    const totals = {
      revenue: totalRevenue,
      orders: Object.values(dailyData).reduce(
        (sum, day) => sum + day.orders,
        0
      ),
      items: totalProducts,
      couponDiscount: totalCouponDiscount,
      productDiscount: totalProductDiscount,
      totalDeliveredProducts,
      totalUsers,
      totalReturns,
      totalOrders: totalOrdersCount,
    };
    console.log("sortedProducts length", sortedProducts.length);

    res.render("admin/dashboardgraph", {
      sortedProducts,
      sortedCategories,
      sortedBrands,
      totals,
      selectedDates: { startDate, endDate },
      graphData,
    });
  } catch (error) {
    console.error("Error fetching sales analytics:", error);
    res.status(500).send("Server Error");
  }
};

const adminLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

module.exports = {
  loadLogin,
  login,
  loadSales,
  adminLogout,
  loadDashboardGraph,
};
