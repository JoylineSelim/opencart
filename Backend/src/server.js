import dotenv from 'dotenv';
import express from 'express';
import {connectDB} from './config/DB.js';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailService from './Services/emailService.js';  
import productRouter from './Routes/productRoutes.js';
import stripePaymentRouter from './Routes/PaymentsRoutes/stripePaymentRoutes.js';
import cors from 'cors'
import userRouter from './Routes/userRoutes.js'
import emailRouter from './Routes/emailRoutes.js';
import orderRouter from './Routes/orderRoutes.js';
import mpesaRouter from './Routes/PaymentsRoutes/mpesaRoutes.js'
import bankRouter from './Routes/PaymentsRoutes/BankRoutes.js'
const app = express();
const PORT =5000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') })

app.use(express.json());
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
}));
app.use("/api/products/",productRouter)
app.use('/api/payments/stripe',stripePaymentRouter)
app.use('/api/user',userRouter)
app.use('/api',emailRouter)
app.use('/api/orders', orderRouter);
app.use('/api/payments/mpesa',mpesaRouter)
app.use('/api/payments/bank',bankRouter)

const startServer = async() =>{
    try {
        console.log("Awaiting DB connection")
        await connectDB();
        console.log("DB connected Successfully")
        

        app.listen(PORT,()=>{
        
        console.log(`Server has started from localhost:${PORT}`)
    
})

    } catch (error) {
        console.error("Failed to Start Server", error.message)
        process.exit(1)
    }
}

startServer()

