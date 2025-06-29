    import Product from "../models/product.model.js";

    export const getAllProducts = async (req, res) => {
    try {
        const products = await Product.find()
        return res.status(200).json({success:true, data:products})
    } catch (error) {
        console.error("Could not find any Products:",error.message)
        res.status(500).json({success:false,message:"Internal Server Error."})
    }
    };

    export const createNewProduct = async (req, res) => {
    const {name,description,price,image,rating,numReviews} = req.body; //user will send this data
    const product = new Product({
        name,description,price,image,rating,numReviews
    })
    if (!product.name || !product.price || !product.image || !product.description || !product.rating) {
        return res
        .status(400)
        .json({ success: false, message: "Please provide all the fields!" });
    }
    try {
        product.rating = ((product.rating*product.numReviews)+newRating)/(product.numReviews +1)
        product.numReviews +=1
        const newProduct =  await product.save();
        res.status(201).json({ success: true, data: newProduct });
        

    } catch (error) {
        console.error("Error in Create Product:", error.message);
        res.status(500).json({ success: false, message: "Server Error" });
    }
    };



    export const getOneProduct = async (req,res) => {
            try {
                const productSearched = await product.findById(req.params.id)
                if (!productSearched){
                    res.status(404).json({success:false, message:"Product Not Found"})
                }
                return res.status(200).json({success:true,data:productSearched})
            
        } catch (error) {
            console.error("Internal Server Error.",error.message)
            return res.status(500).json({success:false,message:"Internal Server Error"})
        }
        

    }


export const updateProductById = async (req,res) =>{
    try {
        const updatedProduct = await Product.findByIdAndUpdate(req.params.id, {$set : req.body},{new:true})

        if (!updatedProduct) return res.status(404).json({success:false,message:"Product Not Found"})

        return res.status(200).json({success:true, data:updatedProduct})



    }catch(error){
        console.error("Internal Server Error",error.message)
        res.status(500).json({success:false,message:"Internal Server Error"})
    }

}

export   const deleteProductById = async (req,res) =>{
    try {

        const deleteProduct = await Product.findByIdAndDelete(req.params.id)
        const {name} = req.body
        const product = Product({name})
        if (!deleteProduct) return res.status(404).json({success:false,message:"Product Not Found"})

        return res.status(200).json({success:true,message:`${product.name} has been deleted successfully`})
        } catch (error) {
        console.error("Internal Server Error:",error.message)
        res.status(500).json({success:true,message:"Internal Server Error"})
    }
}
