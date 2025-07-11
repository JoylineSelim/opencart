import dotenv from 'dotenv';
import express from 'express';
import {connectDB} from './config/DB.js';
import path from 'path';
import { fileURLToPath } from 'url';
import EmailService from './Services/emailService.js';  
import productRouter from './Routes/productRoutes.js';
import paymentRouter from './Routes/paymentRoutes.js';
import userRouter from './Routes/userRoutes.js'
import emailRouter from './Routes/emailRoutes.js';

const app = express();
const PORT =5000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') })

app.use(express.json());
app.use("/api/products/",productRouter)
app.use('/api/payments',paymentRouter)
app.use('/api/user',userRouter)
app.use('/api',emailRouter)


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

