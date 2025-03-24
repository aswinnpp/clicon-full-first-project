const Category = require("../../models/categorymodel");
const Product = require("../../models/productmodel");
const mongoose = require("mongoose");

const loadCategoryManage = async (req, res) => {
  try {
    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const categories = await Category.find({})
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalCategory = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategory / limit);

    res.status(200).render("admin/categorymanage", {
      categories,
      currentPage: page,
      totalPages,
      message,
      limit,
    });
  } catch (error) {
    console.log("categorymanage page not found");
    res.status(500).send("server error");
  }
};

const loadCategoryCreate = async (req, res) => {
  try {
    const category = await Category.find({ isDeleted: false });
    res.status(200).render("admin/categorycreate", { category });
  } catch (error) {
    console.log("categorycreate page not found");
    res.status(500).send("server error");
  }
};

const categoryCreate = async (req, res) => {
  try {
    const { name, status, offer } = req.body;

    const offerValue = parseInt(offer) || 0;
    if (offerValue < 0 || offerValue > 100) {
      req.flash("error", "Offer percentage must be between 0 and 100");
      return res.status(400).redirect("/admin/categorycreate");
    }

    const checkExist = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
    });

    if (checkExist) {
      req.flash("error", "Category already exists");
      return res.status(409).redirect("/admin/categorycreate");
    }

    const newCategory = new Category({
      name,
      status,
      offer: offerValue,
    });

    await newCategory.save();
    req.flash("success", "Category created successfully");
    res.status(201).redirect("/admin/categorymanage");
  } catch (error) {
    console.log(error);
    req.flash("error", "Server error");
    res.status(500).redirect("/admin/categorycreate");
  }
};

const loadCategoryUpdate = async (req, res) => {
  try {
    const id = req.params.id;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render("admin/404");
    }

    const category = await Category.find({ _id: id, isDeleted: false });
    res.status(200).render("admin/categoryupdate", { category });
  } catch (error) {
    console.log("categoryupdate page not found");
    res.status(500).send("server error");
  }
};

const CategoryUpdate = async (req, res) => {
  try {
    const { name, status, id, offer } = req.body;

    const offerValue = parseInt(offer) || 0;
    if (offerValue < 0 || offerValue > 100) {
      req.flash("error", "Offer percentage must be between 0 and 100");
      return res.status(400).redirect("/admin/categorymanage");
    }

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render("admin/404");
    }

    const exists = await Category.findOne({
      name: { $regex: new RegExp("^" + name + "$", "i") },
      _id: { $ne: id },
    });

    if (exists) {
      req.flash("error", "Category name already exists");
      return res.status(409).redirect("/admin/categorymanage");
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        name,
        status,
        offer: offerValue,
      },
      { new: true }
    );

    if (!updatedCategory) {
      req.flash("error", "Category not found");
      return res.status(404).redirect("/admin/categorymanage");
    }

    // Find all products in this category
    const products = await Product.find({ categoryId: id });

    for (const product of products) {
      // Get the original product offer from the database
      const originalProductOffer =
        parseFloat(product.originalOffer) || parseFloat(product.offer) || 0;

      // If category offer is greater than product's original offer
      if (offerValue > originalProductOffer) {
        await Product.findByIdAndUpdate(product._id, {
          offer: `${offerValue}%`,
          originalOffer: originalProductOffer, // Store the original offer
          maxOfferApplied: offerValue,
        });
      } else {
        // If product's original offer is higher or equal, revert to original offer
        await Product.findByIdAndUpdate(product._id, {
          offer: `${originalProductOffer}%`,
          originalOffer: originalProductOffer, // Store the original offer
          maxOfferApplied: originalProductOffer,
        });
      }
    }

    req.flash("success", "Category updated successfully.");
    res.status(200).redirect("/admin/categorymanage");
  } catch (error) {
    console.log(error);
    req.flash("error", "Server error");
    res.status(500).redirect("/admin/categorymanage");
  }
};

const categoryDelete = async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(404).render("admin/404");
    }

    await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    await Product.updateMany({ categoryId: categoryId }, { isDeleted: true });
    res.status(200).json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update category status." });
  }
};

module.exports = {
  loadCategoryManage,
  loadCategoryCreate,
  categoryCreate,
  loadCategoryUpdate,
  CategoryUpdate,
  categoryDelete,
};
