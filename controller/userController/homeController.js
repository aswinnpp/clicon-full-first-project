const Product = require("../../models/productmodel");
const Category = require("../../models/categorymodel");
const userSchema = require("../../models/usermodel");
const Order = require("../../models/orderdetails");
const mongoose = require("mongoose");

const loadHome = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    const categories = await Category.find({ isDeleted: false });

    const message = req.flash("cart");

    const email = req.session?.details?.email;
    console.log(email);

    const userr = await userSchema.findOne({ email });

    res.render("user/user_home", {
      product: products,
      userr,
      message,
      category: categories,
      user: req.session.details,
    });
  } catch (error) {
    console.error("Home load error:", error);
    res.status(500).send("Server Error");
  }
};

const searchProducts = async (req, res) => {
  try {
    const searchTerm = req.query.q || "";
    const selectedCategories = req.query.category ? req.query.category.split(",") : [];
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 1;
    const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : 1000000;
    const sortOrder = req.query.sort || "az";

    const pipeline = [
     
      { $match: { isDeleted: false } },
      

      {
        $addFields: {
          numericPrice: {
            $convert: {
              input: { $replaceAll: { input: "$price", find: ",", replacement: "" } },
              to: "double",
              onError: 0
            }
          }
        }
      }
    ];

    if (searchTerm) {
      pipeline.push({
        $match: {
          productname: { $regex: searchTerm, $options: "i" }
        }
      });
    }

    
    if (selectedCategories.length > 0) {
      pipeline.push({
        $match: {
          category: { $in: selectedCategories }
        }
      });
    }
 
    pipeline.push({
      $match: {
        numericPrice: {
          $gte: minPrice,
          $lte: maxPrice
        }
      }
    });

    let sortStage = {};
    switch (sortOrder) {
      case "az":
        sortStage = { $sort: { productname: 1 } };
        break;
      case "za":
        sortStage = { $sort: { productname: -1 } };
        break;
      case "price-low":
        sortStage = { $sort: { numericPrice: 1 } };
        break;
      case "price-high":
        sortStage = { $sort: { numericPrice: -1 } };
        break;
      default:
        sortStage = { $sort: { _id: -1 } };
    }
    pipeline.push(sortStage);

 
    const products = await Product.aggregate(pipeline);

 
    const productsWithOfferPrices = products.map(product => {
      const offer = Number(product.offer?.slice(0, -1)) || 0;
      const price = product.numericPrice;
      const offerprice = price - (price * (offer / 100));
      return {
        ...product,
        offerprice: Math.floor(offerprice)
      };
    });

    res.json({
      products: productsWithOfferPrices,
      totalProducts: productsWithOfferPrices.length,
      message: ""
    });

  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({
      products: [],
      totalProducts: 0,
      message: "Error occurred while searching"
    });
  }
};

const productList = async (req, res) => {
  try {
    const message = req.flash("count");
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const searchQuery = req.query.q || "";
    const selectedCategories = req.query.category
      ? req.query.category.split(",")
      : [];
    const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 1;
    const maxPrice = req.query.maxPrice
      ? parseFloat(req.query.maxPrice)
      : 1000000;
    const sortOrder = req.query.sort || "az";

    // Build the initial pipeline stages
    const pipeline = [
      // First stage: Match non-deleted products
      { $match: { isDeleted: false } },
      
      // Second stage: Add a numeric price field
      {
        $addFields: {
          numericPrice: {
            $convert: {
              input: { $replaceAll: { input: "$price", find: ",", replacement: "" } },
              to: "double",
              onError: 0
            }
          }
        }
      }
    ];

    // Add search filter if provided
    if (searchQuery) {
      pipeline.push({
        $match: {
          productname: { $regex: searchQuery, $options: "i" }
        }
      });
    }

    // Add category filter if provided
    if (selectedCategories.length > 0) {
      pipeline.push({
        $match: {
          category: { $in: selectedCategories }
        }
      });
    }

    // Add price filter
    pipeline.push({
      $match: {
        numericPrice: {
          $gte: minPrice,
          $lte: maxPrice
        }
      }
    });

    // Add sorting
    let sortStage = {};
    switch (sortOrder) {
      case "az":
        sortStage = { $sort: { productname: 1 } };
        break;
      case "za":
        sortStage = { $sort: { productname: -1 } };
        break;
      case "price-low":
        sortStage = { $sort: { numericPrice: 1 } };
        break;
      case "price-high":
        sortStage = { $sort: { numericPrice: -1 } };
        break;
      default:
        sortStage = { $sort: { _id: -1 } };
    }
    pipeline.push(sortStage);

    // Get total count of filtered products
    const countPipeline = [...pipeline];
    countPipeline.push({ $count: "total" });
    const countResult = await Product.aggregate(countPipeline);
    const totalProducts = countResult[0]?.total || 0;

    // Add pagination
    pipeline.push(
      { $skip: (page - 1) * limit },
      { $limit: limit }
    );

    // Execute the pipeline
    const products = await Product.aggregate(pipeline);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limit);

    const categories = await Category.find({ isDeleted: false });

    console.log("Sending to template:", {
      productsCount: totalProducts,
      currentPage: page,
      totalPages,
      productsInPage: products.length
    });

    res.render("user/productlist", {
      product: products,
      currentPage: page,
      totalPages,
      message,
      searchQuery,
      selectedCategories,
      minPrice,
      maxPrice,
      sortOrder,
      category: categories,
      user: req.session.details,
    });
  } catch (error) {
    console.error("Product list error:", error);
    res.status(500).send("Server Error");
  }
};

const productView = async (req, res) => {
  try {
    const id = req.params.product_id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render("user/404");
    }

    const objectId = new mongoose.Types.ObjectId(id);

    const allproduct = await Product.find({ isDeleted: false });
    const product = await Product.find({ _id: objectId });
    const user = await userSchema.find({});
    console.log(typeof product);
    const category = await Category.find({
      isDeleted: false,
    });

    res.render("user/productview", { product, allproduct, category, user });
  } catch (error) {
    console.log("user productView error:", error);
  }
};
// Load Ban Page
const banPage = (req, res) => {
  res.render("user/banuser");
};

module.exports = {
  loadHome,
  productList,
  productView,
  banPage,
  searchProducts,
};
