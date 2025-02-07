const Product = require("../../models/productmodel");
const Category = require("../../models/categorymodel");
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const mongoose = require("mongoose");

const loadProductManage = async (req, res) => {
  try {
    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;
    const searchQuery = req.query.search || '';
    const category = req.query.category || '';

    
    let query = {};
    
    if (searchQuery) {
      query.productname = { $regex: new RegExp(searchQuery, 'i') };
    }

    if (category) {
      query.category = category;
    }

    const products = await Product.find(query)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalProduct = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProduct / limit);

    res.render("admin/productmanage", {
      products,
      currentPage: page,
      totalPages,
      message,
      limit,
      searchQuery,
      category 
    });
  } catch (error) {
    console.log("Product management page not found", error);
    res.status(500).send("Server error");
  }
};


const loadProductUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/404');
    }
    const categories = await Category.find({ isDeleted: false });
    const products = await Product.findOne({ _id: id, isDeleted: false });
    res.render("admin/productupdate", { products, categories });
  } catch (error) {
    console.error("Error loading product:", error);
    res.status(500).json({ message: "Failed to load product" });
  }
};

const productUpdate = async (req, res) => {
  try {
    const croppedImages = Object.keys(req.body).filter(key => key.includes('_cropped'));
    const croppedImageFilenames = {};

    croppedImages.forEach(imageKey => {
      const base64Data = req.body[imageKey];
      const matches = base64Data.match(/^data:image\/(\w+);base64,(.+)$/);
      if (matches) {
        const extension = matches[1];
        const base64String = matches[2];
        const filename = `${imageKey}-${Date.now()}.${extension}`;
        const filepath = path.join(__dirname, '../../uploads', filename);
        fs.writeFileSync(filepath, Buffer.from(base64String, 'base64'));
        croppedImageFilenames[imageKey] = filename;
      }
    });

    const { id, productname, category, brand, offer, price, stock, warranty, color, description, rating, ram, storage } = req.body;
    const categoryId = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') },
      isDeleted: false,
    });

    const currentProduct = await Product.findById(id);
    let images = currentProduct.image || [];

    for (let i = 0; i < Object.entries(req.files).length; i++) {
      const file = Object.entries(req.files)[i][1][0];
      const lastChar = file.fieldname.slice(-1);
      const u = Number(lastChar);
      const key = `imagePreview${u + 1}_cropped`;
      file.filename = croppedImageFilenames[key] || file.filename;
      images[u] = file.filename;
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        productname,
        category: categoryId.name,
        brand,
        offer,
        price,
        stock,
        warranty,
        color: color.split(',').map(c => c.trim()),
        description,
        rating,
        ram: ram.split(',').map(c => c.trim()),
        storage: storage.split(',').map(c => c.trim()),
        image: images,
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ error: "Failed to update product." });
    }
    res.redirect('/admin/productmanage');
  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
};

const loadProductcreate = async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    res.render("admin/productcreate", { categories });
  } catch (error) {
    console.log("productcreate page not found");
    res.status(500).send("server error");
  }
};

const Productcreate = async (req, res) => {
  try {
    const { productname, category, brand, offer, price, stock, warranty, color, description, rating, ram, storage } = req.body;
    const categoryId = await Category.findOne({
      name: { $regex: new RegExp(`^${category}$`, 'i') },
      isDeleted: false,
    });

    let images = [];
    Object.keys(req.body).forEach(key => {
      if (key.includes('_cropped')) {
        const base64Image = req.body[key];
        if (base64Image.startsWith('data:image/')) {
          const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, '');
          const buffer = Buffer.from(base64Data, 'base64');
          const filename = `image_${uuidv4()}.png`;
          const filepath = path.join(__dirname, '../../uploads/', filename);
          fs.writeFileSync(filepath, buffer);
          images.push(filename);
        }
      }
    });

    const newProduct = new Product({
      productname,
      category,
      categoryId: categoryId,
      brand,
      offer,
      price,
      stock,
      warranty,
      color: color.split(',').map(c => c.trim()),
      description,
      rating,
      ram,
      storage,
      image: images,
    });

    await newProduct.save();
    res.redirect('/admin/productmanage');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error while creating the product');
  }
};

const loadProductview = async (req, res) => {
  try {
    const id = req.params.id;
    const product = await Product.find({ _id: id, isDeleted: false });
    res.render("admin/productview", { product });
  } catch (error) {
    console.log("productview page not found");
    res.status(404).render('admin/404');
  }
};

const productDelete = async (req, res) => {
  try {
    const productId = req.params.id;
    await Product.findByIdAndUpdate(productId, { isDeleted: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.json({ success: false, message: 'Failed to update product status.' });
  }
};

module.exports = {
  loadProductManage,
  loadProductUpdate,
  productUpdate,
  loadProductcreate,
  Productcreate,
  loadProductview,
  productDelete
};