import express from 'express'
import { createNewProduct,getAllProducts,getOneProduct,updateProductById,deleteProductById } from '../Controllers/productControllers.js'

const router = express.Router()
router.get('/getAllProducts',getAllProducts)
router.post('/createNewProduct',createNewProduct)
router.get('/getOneProduct/:id',getOneProduct)
router.put('/updateProduct/:id',updateProductById)
router.delete('/deleteProduct/:id',deleteProductById)

export default router