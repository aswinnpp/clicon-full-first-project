const payments = require("../../models/paymentmodel")
const Wallet = require("../../models/walletmodel")
const User = require("../../models/usermodel")



const loadWallet = async (req, res) => {
    try {
        const email = req.session.details.email;
        const user = await User.findOne({ email: email });

        if (!user) {
            return res.status(404).send("User not found");
        }

        const page = parseInt(req.query.page) || 1; 
        const limit = 5; 
        const skip = (page - 1) * limit;

        const transactions = await payments.find({ userId: user._id })
            .sort({ createdAt: -1 }) 
            .skip(skip)
            .limit(limit);

        const totalTransactions = await payments.countDocuments({ userId: user._id });
        const totalPages = Math.ceil(totalTransactions / limit);

    
        const wallet = await Wallet.findOne({ userId: user._id });

        res.render("user/wallet", { transactions, wallet, page, totalPages });

    } catch (error) {
        console.error(error);
        res.status(500).send("Internal Server Error");
    }
};



module.exports = {loadWallet}