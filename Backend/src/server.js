import dotenv from 'dotenv';
import express from 'express';
import {connectDB} from './config/DB.js';
import path from 'path';
import { fileURLToPath } from 'url';

import notesRouter from './Routes/productsRoutes.js';


const app = express();
const PORT =5000
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '.env') })

app.use(express.json());//allows us to accept json data into the req.body
app.use("/api/products/",notesRouter)


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

