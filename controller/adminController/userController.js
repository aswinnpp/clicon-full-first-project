const User = require("../../models/usermodel");
const bcrypt = require("bcrypt");

const loadUserManage = async (req, res) => {
  try {
    const message = req.flash("success");
    const page = parseInt(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;

    const users = await User.find({ role: "user" })
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });
    const totalUsers = await User.countDocuments({ role: "user" });
    const totalPages = Math.ceil(totalUsers / limit);

    res.render("admin/usermanage", {
      users,
      currentPage: page,
      totalPages,
      message,
      limit,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("server error");
  }
};

const loadUserUpdate = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) return res.status(404).send("User not found");
    res.render("admin/userupdate", { user });
  } catch (error) {
    console.log("userupdate page not found");
    res.status(500).send("server error");
  }
};

const updateUser = async (req, res) => {
  try {
    const { id, name, email, password, phone } = req.body;
    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const existingUser = await User.findOne({ email, _id: { $ne: id } });
    if (existingUser)
      return res.status(400).json({ message: "Email already in use" });

    user.name = name || user.name;
    user.email = email || user.email;
    user.phone = phone || user.phone;

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      user.password = hashedPassword;
    }

    await user.save();
    res.redirect("/admin/usermanage");
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating user" });
  }
};

const banUser = async (req, res) => {
  try {
    const userId = req.params.id;
    const { isBan } = req.body;
    await User.findByIdAndUpdate(userId, { isBan: !isBan });
    res.json({ success: true });
  } catch (error) {
    console.log(error);
    res.status(500).send("Error banning user");
  }
};

module.exports = { loadUserManage, loadUserUpdate, updateUser, banUser };
