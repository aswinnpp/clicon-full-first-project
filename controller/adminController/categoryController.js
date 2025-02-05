const Category = require("../../models/categorymodel");
const Product = require("../../models/productmodel");
const mongoose = require("mongoose");

const loadCategoryManage = async (req, res) => {
  try {
    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 4;
    const skip = (page - 1) * limit;

    const categories = await Category.find({}).skip(skip).limit(limit);
    const totalCategory = await Category.countDocuments();
    const totalPages = Math.ceil(totalCategory / limit);

    res.render("admin/categorymanage", {
      categories,
      currentPage: page,
      totalPages,
      message,
      limit
    });
  } catch (error) {
    console.log("categorymanage page not found");
    res.status(500).send("server error");
  }
};

const loadCategoryCreate = async (req, res) => {
  try {
    const category = await Category.find({ isDeleted: false });
    res.render('admin/categorycreate', { category });
  } catch (error) {
    console.log("categorycreate page not found");
    res.status(500).send("server error");
  }
};

const categoryCreate = async (req, res) => {
  try {
    const { name, status, description } = req.body;
    const checkExist = await Category.find({ name: { $regex: new RegExp('^' + name + '$', 'i') } });

    if (checkExist.length > 0) {
      req.flash("success", "category already exist");
      return res.redirect("/admin/categorymanage");
    }

    const newCategory = new Category({ name, status, description });
    await newCategory.save();
    req.flash("success", "category create successfully");
    res.redirect('/admin/categorymanage');
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

const loadCategoryUpdate = async (req, res) => {
  try {
    const id = req.params.id;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/404');
    }
    const category = await Category.find({ _id: id, isDeleted: false });
    res.render('admin/categoryupdate', { category });
  } catch (error) {
    console.log("categoryupdate page not found");
    res.status(500).send("server error");
  }
};

const CategoryUpdate = async (req, res) => {
  try {
    const { name, status, id, description } = req.body;
    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(404).render('admin/404');
    }

    const exists = await Category.findOne({ name: { $regex: new RegExp('^' + name + '$', 'i') } });
    if (exists) {
      req.flash("success", "Category name already exists.");
      return res.redirect('/admin/categorymanage');
    }

    const updatedCategory = await Category.findOneAndUpdate(
      { _id: id },
      { name, status, description },
      { new: true }
    );

    if (!updatedCategory) {
      req.flash("success", "Category not found");
      return res.redirect('/admin/categorymanage');
    }
    res.redirect('/admin/categorymanage');
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

const categoryDelete = async (req, res) => {
  try {
    const categoryId = req.params.id;
    if (!categoryId || !mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(404).render('admin/404');
    }

    await Category.findByIdAndUpdate(categoryId, { isDeleted: true });
    await Product.updateMany({ categoryId: categoryId }, { isDeleted: true });
    res.json({ success: true });
  } catch (error) {
    res.json({ success: false, message: 'Failed to update category status.' });
  }
};

module.exports = {
  loadCategoryManage,
  loadCategoryCreate,
  categoryCreate,
  loadCategoryUpdate,
  CategoryUpdate,
  categoryDelete
};