import mongoose from "mongoose";
const productSchema =new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true
    },
    description:{
        type:String,
        required:true
    },
    price:{
        type:Number,
        required:true
    },
    image:{
        type:String,
        required:true
    },
    rating:{
        type:Number,
        default:0,
        min:0,
        max:5

    },
    numReviews:{
        type:Number,
        default:0
    }
},{
    timestamps:true
});

const Product =mongoose.model('Product',productSchema)

export default Product