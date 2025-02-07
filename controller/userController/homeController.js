const Product = require("../../models/productmodel");
const Category = require("../../models/categorymodel");
const userSchema = require("../../models/usermodel")
const mongoose  = require("mongoose")


  const loadHome = async (req, res) => {
    try {
      const products = await Product.find({ isDeleted: false });
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
      const searchQuery = req.query.q?.trim().toLowerCase() || "";
      const selectedCategories = req.query.category?.split(",").map(cat => cat.trim()) || [];
      const minPrice = parseFloat(req.query.minPrice) || 0;
      const maxPrice = parseFloat(req.query.maxPrice) || 1000000;
      const sortOrder = req.query.sort || 'az';
  
      let products = await Product.find({ isDeleted: false });
  
      products = products.filter(product => 
        (!selectedCategories.length || selectedCategories.includes(product.category)) &&
        product.productname.toLowerCase().includes(searchQuery) &&
        (parseFloat(product.price.replace(/[^0-9.]/g, '')) >= minPrice && parseFloat(product.price.replace(/[^0-9.]/g, '')) <= maxPrice)
      );
  
      const sortOptions = {
        'az': (a, b) => a.productname.localeCompare(b.productname),
        'za': (a, b) => b.productname.localeCompare(a.productname),
        'price-low': (a, b) => parseFloat(a.price) - parseFloat(b.price),
        'price-high': (a, b) => parseFloat(b.price) - parseFloat(a.price),
      };
  
      products.sort(sortOptions[sortOrder] || (() => 0));
      
      res.render("user/productlist", {
        product: products,
        category: await Category.find({ isDeleted: false }),
        user: req.session.details,
        message,
        searchQuery,
        selectedCategories,
        minPrice,
        maxPrice,
        sortOrder
      });
    } catch (error) {
      console.error("user productList error:", error);
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