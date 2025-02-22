const Product = require("../../models/productmodel");
const Category = require("../../models/categorymodel");
const userSchema = require("../../models/usermodel")
const Order =require("../../models/orderdetails")
const mongoose  = require("mongoose")


const loadHome = async (req, res) => {
  try {
    const products = await Product.find({ isDeleted: false }).sort({ createdAt: -1 });

    const categories = await Category.find({ isDeleted: false });
    const message = req.flash("cart")

      const email = req.session?.details?.email
          console.log(email);
          
          const userr = await userSchema.findOne({email})


    res.render("user/user_home", { product: products,userr,message, category: categories, user: req.session.details });
  } catch (error) {
    console.error("Home load error:", error);
    res.status(500).send("Server Error");
  }
};

  const searchProducts = async (req, res) => {
    try {
      let a=[]
        const searchTerm = req.query.q;
        console.log('Search term received:', searchTerm);
        
        const products = await Product.find({
            productname: { $regex: searchTerm, $options: 'i' },
            isDeleted: false
        }).limit(10);
        
        products.forEach((product,ind)=>{
         
          
          let offer =Number(product.offer.slice(0, -1)); 
          
          
           let price = Number(product.price.replace(/,/g, ''));

     
           const offerprice=price-(price*(offer/100))
          
           
         a.push(offerprice)
        })
     
      
       console.log(a);
      
        res.json({products,offerprice:a});
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json([]);
    }
  }

  const productList = async (req, res) => {
    try {
        const message = req.flash("count");
        const page = parseInt(req.query.page) || 1;
        const limit = 4; 
        const searchQuery = req.query.q || "";
        const selectedCategories = req.query.category ? req.query.category.split(",") : [];
        const minPrice = req.query.minPrice ? parseFloat(req.query.minPrice) : 0;
        const maxPrice = req.query.maxPrice ? parseFloat(req.query.maxPrice) : 1000000;
        const sortOrder = req.query.sort || 'az';

        console.log('Received query params:', {
            page, searchQuery, selectedCategories, minPrice, maxPrice, sortOrder
        });

        let query = { isDeleted: false };

        if (searchQuery) {
            query.productname = { $regex: searchQuery, $options: 'i' };
        }

        if (selectedCategories.length > 0) {
            query.category = { $in: selectedCategories };
        }

        query.price = { $gte: minPrice, $lte: maxPrice }; 


        let sortOptions = {};
        switch (sortOrder) {
            case 'az':
                sortOptions = { productname: 1 };
                break;
            case 'za':
                sortOptions = { productname: -1 };
                break;
            case 'price-low':
                sortOptions = { price: 1 };
                break;
            case 'price-high':
                sortOptions = { price: -1 };
                break;
            default:
                sortOptions = { _id: -1 }; 
        }

        const totalProducts = await Product.countDocuments({isDeleted:false});
        console.log("totalProducts",totalProducts);
        
        const totalPages = Math.ceil(totalProducts / limit);

        const products = await Product.find({isDeleted:false})
            .sort(sortOptions)
            .skip((page - 1) * limit)
            .limit(limit);


            console.log(",",products.length);
            
        const categories = await Category.find({ isDeleted: false });

        console.log('Sending to template:', {
            productsCount: products.length,
            currentPage: page,
            totalPages,
            totalProducts
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
            user: req.session.details
        });

    } catch (error) {
        console.error("Product list error:", error);
        res.status(500).send("Server Error");
    }
};




const productView = async(req,res)=>{

try {

  const id = req.params.product_id
  const objectId = new mongoose.Types.ObjectId(id);

  if (!mongoose.Types.ObjectId.isValid(objectId)) {
    return res.status(400).send('Invalid Product ID');
}

const allproduct =await Product.find({})
  const product = await Product.find({_id:objectId})
  const user = await userSchema.find({})
  console.log(typeof product)
  const category = await Category.find({
    isDeleted:false})


  res.render('user/productview', { product,allproduct,category,user})
  
} catch (error) {
  console.log('user productView error:', error);
}



}
// Load Ban Page
const banPage = (req, res) => {
  res.render("user/banuser");
};

module.exports = {
  loadHome,
  productList,
  productView,
  banPage,
  searchProducts
  
};