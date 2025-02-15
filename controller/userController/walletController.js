const payments = require("../../models/paymentmodel")
const Wallet = require("../../models/walletmodel")
const User = require("../../models/usermodel")




const loadWallet = async (req,res)=>{


    try {

        
    const email =  req.session.details.email


    const user = await User.findOne({email:email})
    console.log(user.id);

    
    const transactions = await payments.find({ userId: user._id }).sort({ createdAt: -1 });

    console.log("transactions",transactions);
    

  
  const wallet = await Wallet.find({userId:user.id})
  console.log("wallet",wallet);
  
        res.render("user/wallet",{transactions ,wallet })
        
    } catch (error) {
        
    }



}


module.exports = {loadWallet}