const Returns = require("../../models/productreturn");
;


const loadReturns = async (req,res)=>{
    try {



        const returns = await Returns.find({})
        .populate({ path: "userId", select: "name email" })
        .populate({ path: "productId", select: "productname price images" })
        .populate({ path: "orderId", select: "totalAmount createdAt" })
        .lean();  
    
    console.log("Populated Returns:", returns);
     
    


console.log("jjjjjjjjjj",returns,"lllllllllllllll")

        res.render("admin/productreturns",{returns})
        
    } catch (error) {
        console.log(error)
    }
}


module.exports ={
 loadReturns
}