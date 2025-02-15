const User = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const Coupon = require("../../models/couponmodel");
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


const loadDashboard = async (req, res) => {
  try {
    const totalUsersPromise = User.countDocuments({ role: "user" });
    const totalOrdersPromise = Order.countDocuments();

    const totalRevenuePromise = Order.aggregate([
      { $group: { _id: null, total: { $sum: "$totalAmount" } } }
    ]).then(result => (result.length ? result[0].total : 0));

    const [totalUsers, totalOrders, totalRevenue, dailySales, weeklySales, monthlySales, yearlySales] =
      await Promise.all([
        totalUsersPromise,
        totalOrdersPromise,
        totalRevenuePromise,
        calculateSales("daily"),
        calculateSales("weekly"),
        calculateSales("monthly"),
        calculateSales("yearly"),
      ]);

    res.render("admin/dashboard", {
      totalUsers,
      totalOrders,
      totalRevenue,
      salesReport: {
        daily: dailySales,
        weekly: weeklySales,
        monthly: monthlySales,
        yearly: yearlySales,
      },
    });

    console.log("Dashboard successfully loaded!");
  } catch (error) {
    console.log("Admin dashboard error:", error);
    res.status(500).send("Server error");
  }
};

const calculateSales = async (timeFrame) => {
  let startDate;
  const now = new Date();
  
  if (timeFrame === "daily") {
    startDate = new Date();
    startDate.setUTCHours(0, 0, 0, 0);
  } else if (timeFrame === "weekly") {
    startDate = new Date(now.setDate(now.getDate() - 7));
  } else if (timeFrame === "monthly") {
    startDate = new Date(now.setMonth(now.getMonth() - 1));
  } else if (timeFrame === "yearly") {
    startDate = new Date(now.setFullYear(now.getFullYear() - 1));
  }

  const salesData = await Order.find({ createdAt: { $gte: startDate } })
    .populate("coupon")
    .populate("items.productId");

  let totalSales = 0;
  let count = salesData.length;
  let couponUsageCount = 0;
  let totalCouponDiscount = 0;
  let totalDiscount = 0;
  
  for (const order of salesData) {
    totalSales += order.totalAmount;
    if (order.coupon) {
      couponUsageCount++;
      totalCouponDiscount += order.coupon.discountValue;
    }
    
    for (const item of order.items) {
      if (item.productId && item.productId.offer) {
        let originalPrice = parseFloat(item.productId.price.replace(/,/g, ""));
        let discountPercent = parseFloat(item.productId.offer.replace("%", ""));
        let discountAmount = (originalPrice * discountPercent) / 100 * item.quantity;
        totalDiscount += discountAmount;
      }
    }
  }
  
  return { totalSales, count, totalDiscount, couponUsageCount, totalCouponDiscount };
};



const downloadSalesPDF = async (req, res) => {
  try {
    const { type, format } = req.query;

    if (!["daily", "weekly", "monthly", "yearly"].includes(type)) {
      return res.status(400).send("Invalid report type.");
    }

    const salesData = await calculateSales(type);

    const reportsDir = path.join(process.cwd(), "public/reports");
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
      
    }

    if (format === "pdf") {
      const filename = `sales_report_${type}.pdf`;
      const filePath = path.join(reportsDir, filename);

      const doc = new PDFDocument();
      const stream = fs.createWriteStream(filePath);
      doc.pipe(stream);

      doc.fontSize(20).text(`Sales Report - ${type.toUpperCase()}`, { align: "center" });
      doc.moveDown();
      doc.fontSize(14).text(`Total Sales: ₹${salesData.totalSales}`);
      doc.text(`Total Orders: ${salesData.count}`);
      doc.text(`Total Discount: ₹${salesData.totalDiscount}`);
      doc.text(`Coupon Usage: ${salesData.couponUsageCount}`);
      doc.text(`Total Coupon Discount: ₹${salesData.totalCouponDiscount}`);

      doc.end();

      stream.on("finish", () => {
        res.download(filePath, filename, (err) => {
          setTimeout(() => fs.unlink(filePath, (unlinkErr) => {
          }), 5000);
        });
      });

    } else if (format === "excel") {
      const filename = `sales_report_${type}.xlsx`;
      const filePath = path.join(reportsDir, filename);

      const workbook = new ExcelJS.Workbook();
      const sheet = workbook.addWorksheet("Sales Report");

      sheet.columns = [
        { header: "Metric", key: "metric", width: 30 },
        { header: "Value", key: "value", width: 30 }
      ];

      const data = [
        { metric: "Total Sales", value: `₹${salesData.totalSales}` },
        { metric: "Total Orders", value: salesData.count },
        { metric: "Total Discount", value: `₹${salesData.totalDiscount}` },
        { metric: "Coupon Usage", value: salesData.couponUsageCount },
        { metric: "Total Coupon Discount", value: `₹${salesData.totalCouponDiscount}` }
      ];

      sheet.addRows(data);

      await workbook.xlsx.writeFile(filePath);

      res.download(filePath, filename, (err) => {
        setTimeout(() => fs.unlink(filePath, (unlinkErr) => {
        }), 5000);
      });

    } else {
      res.status(400).send("Invalid format. Use 'pdf' or 'excel'.");
    }

  } catch (error) {
    console.error(" Report Generation Error:", error);
    res.status(500).send("Error generating report");
  }
};







const adminLogout = async (req, res) => {
  req.session.destroy();
  res.redirect("/admin/login");
};

module.exports = { loadLogin, login, loadDashboard, adminLogout ,downloadSalesPDF};
