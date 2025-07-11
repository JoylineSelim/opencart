import EmailService from "../Services/emailService.js";
import express from "express";
const emailRouter = express.Router()

const emailingService = new EmailService({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    email: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    secure: process.env.EMAIL_SECURE === 'true', 
    fromName: 'OpenCart Support',
    baseURL : process.env.BASE_URL || 'http://localhost:5000'
});

emailRouter.get('/health/email', async (req, res) => {
  const emailService = new EmailService({});
  const isConnected = await emailService.testConnection();
  res.status(isConnected ? 200 : 500).json({ emailService: isConnected });
});
export default emailRouter;