import crypto from 'crypto';
import sgMail from '@sendgrid/mail';
import user from '../models/user.model.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import logger from '../utils/logger.js';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../.env') });

class EmailService {
    constructor (config){
        this.apiKey = process.env.SENDGRID_API_KEY ||config.apiKey
        if (!this.apiKey) {
            throw new Error('SENDGRID_API_KEY is not set in environment variables or config');
        }
        if (!sgMail) {
            throw new Error('SendGrid Mail service is not initialized');
        }   
        if (!this.apiKey.startsWith('SG.')) {
            throw new Error('Incorrect SendGrid API key');
        }
        sgMail.setApiKey(this.apiKey);
        this.fromEmail = process.env.FROM_EMAIL || config.fromEmail || 'lenswandie027@gmail.com'
        this.fromName = process.env.FROM_NAME || config.fromName || 'OpenCart ';
        this.baseUrl = process.env.BASE_URL || config.baseUrl || 'http://localhost:5000';
    }
    stripHtml(html) {
    return html.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim();
  }


       async sendEmail(to, subject, htmlContent, textContent) {
        const text = textContent || (htmlContent ? this.stripHtml(htmlContent) : '');
        try {
            const msg= {
                to,
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                  subject,
                text: text,
                html: htmlContent
            };
            console.log("Sending email to:", to);
            console.log("Subject:", subject);
            console.log("HTML:", htmlContent);

            const info = await sgMail.send(msg);
            console.log('Email sent successfully:')
            console.log(`info status code:, ${info[0].statusCode}`);
            logger.info('Email sent successfully:', info);
            return ({success:true, messageId: info[0].headers['x-message-id'] || 'N/A'|| info});
        } catch (error) {
            console.error('Error sending email:', error);
            logger.error('Error sending email:', error);
            return {success:false, error: error.message || 'Failed to send email'};
        }
    
        
    }
     async testConnection() {
        try {
           const test = await sgMail.send({
                to: this.fromEmail,
                from: {
                    email: this.fromEmail,
                    name: this.fromName
                },
                subject: 'Test Email',
                text: 'This is a test email from OpenCart Email Service.',
           })
            console.log('Test email sent successfully:', test);
            return true;
        } catch (error) {
            console.error('Error connecting to email service:', error);
            return false;
        }
    }

    async registrationConfirmation(userEmail, userName, confirmationToken){
    const confirmationUrl = `${this.baseUrl}/api/v1/auth/confirm-email?token=${confirmationToken}`;
    const subject = 'Welcome to OpenCart - Email Confirmation';
    const htmlContent = `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                            <meta charset="UTF-8">
                            <meta name="viewport" content="width=device-width, initial-scale=1.0">
                            <title>Welcome to OpenCart</title>
                            <style>
                                * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                }
                                
                                body {
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: #333;
                                    line-height: 1.6;
                                    padding: 20px;
                                    min-height: 100vh;
                                }
                                
                                .email-wrapper {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    background: rgba(255, 255, 255, 0.95);
                                    backdrop-filter: blur(10px);
                                    border-radius: 20px;
                                    overflow: hidden;
                                    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                                    border: 1px solid rgba(255, 255, 255, 0.2);
                                }
                                
                                .header {
                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                    color: white;
                                    padding: 40px 30px;
                                    text-align: center;
                                    position: relative;
                                    overflow: hidden;
                                }
                                
                                .header::before {
                                    content: '';
                                    position: absolute;
                                    top: 0;
                                    left: 0;
                                    right: 0;
                                    bottom: 0;
                                    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><polygon points="0,0 1000,0 1000,100 0,60"></polygon></svg>');
                                    background-size: cover;
                                }
                                
                                .header h1 {
                                    font-size: 28px;
                                    font-weight: 700;
                                    margin-bottom: 10px;
                                    position: relative;
                                    z-index: 1;
                                }
                                
                                .header p {
                                    font-size: 16px;
                                    opacity: 0.9;
                                    position: relative;
                                    z-index: 1;
                                }
                                
                                .content {
                                    padding: 40px 30px;
                                    background: white;
                                }
                                
                                .welcome-message {
                                    font-size: 18px;
                                    color: #2c3e50;
                                    margin-bottom: 25px;
                                    text-align: center;
                                }
                                
                                .instruction-text {
                                    font-size: 16px;
                                    color: #5a6c7d;
                                    margin-bottom: 30px;
                                    text-align: center;
                                    line-height: 1.8;
                                }
                                
                                .cta-container {
                                    text-align: center;
                                    margin: 40px 0;
                                }
                                
                                .confirm-button {
                                    display: inline-block;
                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                    color: white;
                                    text-decoration: none;
                                    padding: 16px 40px;
                                    border-radius: 50px;
                                    font-size: 16px;
                                    font-weight: 600;
                                    text-transform: uppercase;
                                    letter-spacing: 1px;
                                    box-shadow: 0 10px 30px rgba(40, 167, 69, 0.4);
                                    transition: all 0.3s ease;
                                    border: none;
                                    cursor: pointer;
                                }
                                
                                .confirm-button:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 15px 35px rgba(40, 167, 69, 0.5);
                                }
                                
                                .security-note {
                                    background: #f8f9fa;
                                    border-left: 4px solid #28a745;
                                    padding: 20px;
                                    margin: 30px 0;
                                    border-radius: 8px;
                                    font-size: 14px;
                                    color: #6c757d;
                                }
                                
                                .security-note strong {
                                    color: #28a745;
                                }
                                
                                .support-section {
                                    background: #f8f9fa;
                                    padding: 25px;
                                    border-radius: 12px;
                                    margin: 30px 0;
                                    text-align: center;
                                }
                                
                                .support-section h3 {
                                    color: #2c3e50;
                                    margin-bottom: 10px;
                                    font-size: 18px;
                                }
                                
                                .support-section p {
                                    color: #6c757d;
                                    font-size: 14px;
                                    margin-bottom: 15px;
                                }
                                
                                .support-email {
                                    color: #28a745;
                                    text-decoration: none;
                                    font-weight: 600;
                                }
                                
                                .footer {
                                    background: #2c3e50;
                                    color: white;
                                    padding: 30px;
                                    text-align: center;
                                }
                                
                                .footer-content {
                                    max-width: 400px;
                                    margin: 0 auto;
                                }
                                
                                .footer p {
                                    font-size: 14px;
                                    opacity: 0.8;
                                    margin-bottom: 10px;
                                }
                                
                                .social-links {
                                    margin: 20px 0;
                                }
                                
                                .social-links a {
                                    color: white;
                                    text-decoration: none;
                                    margin: 0 10px;
                                    font-size: 14px;
                                    opacity: 0.8;
                                    transition: opacity 0.3s ease;
                                }
                                
                                .social-links a:hover {
                                    opacity: 1;
                                }
                                
                                .copyright {
                                    font-size: 12px;
                                    opacity: 0.6;
                                    margin-top: 20px;
                                    padding-top: 20px;
                                    border-top: 1px solid rgba(255, 255, 255, 0.1);
                                }
                                
                                /* Responsive Design */
                                @media (max-width: 600px) {
                                    body {
                                        padding: 10px;
                                    }
                                    
                                    .email-wrapper {
                                        margin: 0;
                                        border-radius: 15px;
                                    }
                                    
                                    .header {
                                        padding: 30px 20px;
                                    }
                                    
                                    .header h1 {
                                        font-size: 24px;
                                    }
                                    
                                    .content {
                                        padding: 30px 20px;
                                    }
                                    
                                    .confirm-button {
                                        padding: 14px 30px;
                                        font-size: 14px;
                                    }
                                    
                                    .footer {
                                        padding: 25px 20px;
                                    }
                                }
                                
                                /* Dark mode support */
                                @media (prefers-color-scheme: dark) {
                                    .email-wrapper {
                                        background: rgba(30, 30, 30, 0.95);
                                    }
                                    
                                    .content {
                                        background: #1a1a1a;
                                        color: #e0e0e0;
                                    }
                                    
                                    .welcome-message {
                                        color: #ffffff;
                                    }
                                    
                                    .instruction-text {
                                        color: #b0b0b0;
                                    }
                                    
                                    .security-note {
                                        background: #2a2a2a;
                                        color: #b0b0b0;
                                    }
                                    
                                    .support-section {
                                        background: #2a2a2a;
                                    }
                                    
                                    .support-section h3 {
                                        color: #ffffff;
                                    }
                                    
                                    .support-section p {
                                        color: #b0b0b0;
                                    }
                                }
                            </style>
                        </head>
                        <body>
                            <div class="email-wrapper">
                                <div class="header">
                                    <h1>Welcome to OpenCart!</h1>
                                    <p>Hello ${userName}, we're excited to have you on board</p>
                                </div>
                                
                                <div class="content">
                                    <div class="welcome-message">
                                        Thank you for joining the OpenCart community!
                                    </div>
                                    
                                    <p class="instruction-text">
                                        You're just one click away from accessing your new account. 
                                        To complete your registration and secure your account, please confirm your email address.
                                    </p>
                                    
                                    <div class="cta-container">
                                        <a href="${confirmationUrl}" class="confirm-button">
                                            Confirm Email Address
                                        </a>
                                    </div>
                                    
                                    <div class="security-note">
                                        <strong> Security Note:</strong> This confirmation link will expire in 10 mins for your security. 
                                        If you didn't create an account with OpenCart, please ignore this email.
                                    </div>
                                    
                                    <div class="support-section">
                                        <h3>Need Help?</h3>
                                        <p>If you have any questions or need assistance, our support team is here to help.</p>
                                        <a href="mailto:support@opencart.com" class="support-email">Contact Support</a>
                                    </div>
                                    
                                    <p style="text-align: center; color: #6c757d; font-size: 14px; margin-top: 30px;">
                                        Can't click the button? Copy and paste this link into your browser:<br>
                                        <a href="${confirmationUrl}" style="color: #28a745; word-break: break-all; font-size: 12px;">${confirmationUrl}</a>
                                    </p>
                                </div>
                                
                                <div class="footer">
                                    <div class="footer-content">
                                        <p><strong>OpenCart</strong></p>
                                        <p>Your trusted e-commerce platform</p>
                                        
                                        <div class="social-links">
                                            <a href="#">Privacy Policy</a>
                                            <a href="#">Terms of Service</a>
                                            <a href="#">Help Center</a>
                                        </div>
                                        
                                        <div class="copyright">
                                            © ${new Date().getFullYear()} OpenCart. All rights reserved.
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </body>
                        </html>`;
                                            
                            return await this.sendEmail(userEmail, subject, htmlContent, `Hello ${userName}, please confirm your email at ${confirmationUrl}`);
                        }

    async passwordReset(userEmail, userName, resetToken) {
  const resetUrl = `${this.baseUrl}/api/user/auth/reset/password?token=${resetToken}`;
  const subject = 'OpenCart - Password Reset Request';
  const htmlContent = `
                                <!DOCTYPE html>
                                <html lang="en">
                                <head>
                                <meta charset="UTF-8">
                                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                                <title>Password Reset Request</title>
                                <style>
                                    * {
                                    margin: 0;
                                    padding: 0;
                                    box-sizing: border-box;
                                    }
                                    
                                    body {
                                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
                                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                    color: #333;
                                    line-height: 1.6;
                                    padding: 20px;
                                    min-height: 100vh;
                                    }
                                    
                                    .email-wrapper {
                                    max-width: 600px;
                                    margin: 0 auto;
                                    background: rgba(255, 255, 255, 0.95);
                                    backdrop-filter: blur(10px);
                                    border-radius: 16px;
                                    overflow: hidden;
                                    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
                                    }
                                    
                                    .header {
                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                    color: white;
                                    padding: 30px 20px;
                                    text-align: center;
                                    position: relative;
                                    overflow: hidden;
                                    }
                                    
                                    .header::before {
                                    content: '';
                                    position: absolute;
                                    top: -50%;
                                    left: -50%;
                                    width: 200%;
                                    height: 200%;
                                    background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
                                    animation: shimmer 3s ease-in-out infinite;
                                    }
                                    
                                    @keyframes shimmer {
                                    0%, 100% { transform: rotate(0deg); }
                                    50% { transform: rotate(180deg); }
                                    }
                                    
                                    .header h1 {
                                    font-size: 28px;
                                    font-weight: 700;
                                    margin-bottom: 8px;
                                    position: relative;
                                    z-index: 1;
                                    }
                                    
                                    .header .subtitle {
                                    font-size: 14px;
                                    opacity: 0.9;
                                    position: relative;
                                    z-index: 1;
                                    }
                                    
                                    .content {
                                    padding: 40px 30px;
                                    background: white;
                                    }
                                    
                                    .greeting {
                                    font-size: 24px;
                                    font-weight: 600;
                                    color: #2c3e50;
                                    margin-bottom: 20px;
                                    }
                                    
                                    .message {
                                    font-size: 16px;
                                    color: #555;
                                    margin-bottom: 16px;
                                    }
                                    
                                    .security-notice {
                                    background: linear-gradient(135deg, #fff3cd 0%, #ffeaa7 100%);
                                    border-left: 4px solid #ffc107;
                                    padding: 16px;
                                    margin: 24px 0;
                                    border-radius: 8px;
                                    font-size: 14px;
                                    color: #856404;
                                    }
                                    
                                    .cta-section {
                                    text-align: center;
                                    margin: 32px 0;
                                    }
                                    
                                    .reset-button {
                                    display: inline-block;
                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                    color: white;
                                    text-decoration: none;
                                    padding: 16px 32px;
                                    border-radius: 50px;
                                    font-weight: 600;
                                    font-size: 16px;
                                    transition: all 0.3s ease;
                                    box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
                                    }
                                    
                                    .reset-button:hover {
                                    transform: translateY(-2px);
                                    box-shadow: 0 6px 20px rgba(40, 167, 69, 0.4);
                                    }
                                    
                                    .alternative-link {
                                    margin-top: 20px;
                                    padding: 16px;
                                    background: #f8f9fa;
                                    border-radius: 8px;
                                    font-size: 12px;
                                    color: #666;
                                    word-break: break-all;
                                    }
                                    
                                    .alternative-link strong {
                                    color: #333;
                                    }
                                    
                                    .support-section {
                                    background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
                                    border-radius: 12px;
                                    padding: 20px;
                                    margin: 24px 0;
                                    text-align: center;
                                    }
                                    
                                    .support-section h3 {
                                    color: #1565c0;
                                    margin-bottom: 8px;
                                    font-size: 18px;
                                    }
                                    
                                    .support-section p {
                                    color: #1976d2;
                                    margin-bottom: 12px;
                                    }
                                    
                                    .support-email {
                                    color: #1565c0;
                                    text-decoration: none;
                                    font-weight: 600;
                                    }
                                    
                                    .footer {
                                    background: #2c3e50;
                                    color: white;
                                    padding: 24px;
                                    text-align: center;
                                    }
                                    
                                    .footer-content {
                                    margin-bottom: 16px;
                                    }
                                    
                                    .footer-links {
                                    margin-bottom: 16px;
                                    }
                                    
                                    .footer-links a {
                                    color: #ecf0f1;
                                    text-decoration: none;
                                    margin: 0 12px;
                                    font-size: 14px;
                                    }
                                    
                                    .footer-links a:hover {
                                    color: #28a745;
                                    }
                                    
                                    .copyright {
                                    font-size: 12px;
                                    color: #bdc3c7;
                                    border-top: 1px solid #34495e;
                                    padding-top: 16px;
                                    }
                                    
                                    .brand-logo {
                                    font-size: 32px;
                                    font-weight: 800;
                                    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                    -webkit-background-clip: text;
                                    -webkit-text-fill-color: transparent;
                                    background-clip: text;
                                    margin-bottom: 16px;
                                    }
                                    
                                    @media (max-width: 600px) {
                                    .email-wrapper {
                                        margin: 10px;
                                        border-radius: 12px;
                                    }
                                    
                                    .content {
                                        padding: 24px 20px;
                                    }
                                    
                                    .header {
                                        padding: 24px 16px;
                                    }
                                    
                                    .header h1 {
                                        font-size: 24px;
                                    }
                                    
                                    .greeting {
                                        font-size: 20px;
                                    }
                                    
                                    .reset-button {
                                        padding: 14px 28px;
                                        font-size: 14px;
                                    }
                                    }
                                </style>
                                </head>
                                <body>
                                <div class="email-wrapper">
                                    <div class="header">
                                    <h1>🔐 Password Reset Request</h1>
                                    <div class="subtitle">Secure • Fast • Reliable</div>
                                    </div>
                                    
                                    <div class="content">
                                    <div class="brand-logo">OpenCart</div>
                                    
                                    <div class="greeting">Hello ${userName}! 👋</div>
                                    
                                    <p class="message">
                                        We received a request to reset your password for your OpenCart account. 
                                        No worries - it happens to the best of us!
                                    </p>
                                    
                                    <div class="security-notice">
                                        <strong>🛡️ Security Notice:</strong> If you did not request this password reset, 
                                        please ignore this email. Your account remains secure and no action is required.
                                    </div>
                                    
                                    <div class="cta-section">
                                        <a href="${resetUrl}" class="reset-button">
                                        🔑 Reset My Password
                                        </a>
                                        
                                        <div class="alternative-link">
                                        <strong>Link not working?</strong> Copy and paste this URL into your browser:<br>
                                        ${resetUrl}
                                        </div>
                                    </div>
                                    
                                    <p class="message">
                                        This link will expire in 24 hours for security reasons. If you need a new reset link, 
                                        simply request another password reset from our login page.
                                    </p>
                                    
                                    <div class="support-section">
                                        <h3>Need Help? 🤝</h3>
                                        <p>Our support team is here to assist you!</p>
                                        <a href="mailto:support@opencart.com" class="support-email">
                                        📧 Contact Support
                                        </a>
                                    </div>
                                    
                                    <p class="message">
                                        Thank you for being a valued OpenCart user! We're committed to keeping 
                                        your account safe and secure.
                                    </p>
                                    </div>
                                    
                                    <div class="footer">
                                    <div class="footer-content">
                                        <div class="footer-links">
                                        <a href="#">Privacy Policy</a>
                                        <a href="#">Terms of Service</a>
                                        <a href="#">Help Center</a>
                                        </div>
                                    </div>
                                    <div class="copyright">
                                        © ${new Date().getFullYear()} OpenCart. All rights reserved.<br>
                                        This email was sent to ${userEmail}
                                    </div>
                                    </div>
                                </div>
                                </body>
                                </html>
                            `;
  
  return await this.sendEmail(userEmail, subject, htmlContent);
}
    async sendOrderConfirmation(userEmail, userName, orderDetails) {
    const subject = 'OpenCart - Order Confirmation';
    const htmlContent = `<!DOCTYPE html>
                        <html lang="en">
                        <head>
                        <meta charset="UTF-8">
                        <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        <title>Order Confirmation - OpenCart</title>
                        <style>
                            * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                            }
                            
                            body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                                color: #333;
                                line-height: 1.6;
                                padding: 20px;
                                min-height: 100vh;
                            }
                            
                            .email-wrapper {
                                max-width: 650px;
                                margin: 0 auto;
                                background: rgba(255, 255, 255, 0.95);
                                backdrop-filter: blur(10px);
                                border-radius: 20px;
                                overflow: hidden;
                                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.15);
                                border: 1px solid rgba(255, 255, 255, 0.2);
                            }
                            
                            .header {
                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                color: white;
                                padding: 40px 30px;
                                text-align: center;
                                position: relative;
                                overflow: hidden;
                            }
                            
                            .header::before {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                bottom: 0;
                                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 100" fill="white" opacity="0.1"><polygon points="0,0 1000,0 1000,100 0,60"></polygon></svg>');
                                background-size: cover;
                            }
                            
                            .header h1 {
                                font-size: 28px;
                                font-weight: 700;
                                margin-bottom: 10px;
                                position: relative;
                                z-index: 1;
                            }
                            
                            .header .subtitle {
                                font-size: 16px;
                                opacity: 0.9;
                                position: relative;
                                z-index: 1;
                            }
                            
                            .content {
                                padding: 40px 30px;
                                background: white;
                            }
                            
                            .greeting {
                                font-size: 24px;
                                color: #2c3e50;
                                margin-bottom: 15px;
                                font-weight: 600;
                            }
                            
                            .main-message {
                                font-size: 16px;
                                color: #5a6c7d;
                                margin-bottom: 30px;
                                line-height: 1.8;
                            }
                            
                            .order-summary {
                                background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
                                border-radius: 15px;
                                padding: 30px;
                                margin: 30px 0;
                                border: 1px solid #dee2e6;
                                position: relative;
                                overflow: hidden;
                            }
                            
                            .order-summary::before {
                                content: '';
                                position: absolute;
                                top: 0;
                                left: 0;
                                right: 0;
                                height: 4px;
                                background: linear-gradient(90deg, #28a745, #20c997, #17a2b8);
                            }
                            
                            .order-summary h3 {
                                color: #28a745;
                                font-size: 20px;
                                margin-bottom: 20px;
                                font-weight: 600;
                                display: flex;
                                align-items: center;
                            }
                            
                            .order-summary h3::before {
                                content: '🛒';
                                margin-right: 10px;
                                font-size: 18px;
                            }
                            
                            .order-details-grid {
                                display: grid;
                                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                                gap: 20px;
                                margin-bottom: 25px;
                            }
                            
                            .detail-item {
                                background: white;
                                padding: 20px;
                                border-radius: 10px;
                                border: 1px solid #e9ecef;
                                text-align: center;
                                transition: transform 0.3s ease;
                            }
                            
                            .detail-item:hover {
                                transform: translateY(-2px);
                                box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
                            }
                            
                            .detail-item .label {
                                font-size: 14px;
                                color: #6c757d;
                                text-transform: uppercase;
                                letter-spacing: 0.5px;
                                margin-bottom: 5px;
                                font-weight: 600;
                            }
                            
                            .detail-item .value {
                                font-size: 18px;
                                color: #2c3e50;
                                font-weight: 700;
                            }
                            
                            .detail-item.total {
                                background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
                                color: white;
                                border: none;
                            }
                            
                            .detail-item.total .label,
                            .detail-item.total .value {
                                color: white;
                            }
                            
                            .items-section {
                                margin-top: 30px;
                            }
                            
                            .items-section h4 {
                                color: #2c3e50;
                                font-size: 18px;
                                margin-bottom: 15px;
                                font-weight: 600;
                            }
                            
                            .item-list {
                                background: white;
                                border-radius: 10px;
                                border: 1px solid #e9ecef;
                                overflow: hidden;
                            }
                            
                            .item-row {
                                display: grid;
                                grid-template-columns: 1fr auto auto;
                                gap: 15px;
                                padding: 15px 20px;
                                border-bottom: 1px solid #f8f9fa;
                                align-items: center;
                            }
                            
                            .item-row:last-child {
                                border-bottom: none;
                            }
                            
                            .item-row:nth-child(even) {
                                background: #f8f9fa;
                            }
                            
                            .item-name {
                                font-weight: 600;
                                color: #2c3e50;
                            }
                            
                            .item-qty {
                                color: #6c757d;
                                font-size: 14px;
                            }
                            
                            .item-price {
                                font-weight: 700;
                                color: #28a745;
                            }
                            
                            .status-section {
                                background: #e8f5e8;
                                border-radius: 12px;
                                padding: 25px;
                                margin: 30px 0;
                                border-left: 4px solid #28a745;
                            }
                            
                            .status-section h4 {
                                color: #28a745;
                                margin-bottom: 10px;
                                font-size: 16px;
                                font-weight: 600;
                            }
                            
                            .status-section p {
                                color: #155724;
                                font-size: 14px;
                                margin-bottom: 15px;
                            }
                            
                            .tracking-info {
                                background: white;
                                padding: 15px;
                                border-radius: 8px;
                                border: 1px solid #c3e6cb;
                            }
                            
                            .tracking-info strong {
                                color: #28a745;
                            }
                            
                            .next-steps {
                                background: #f8f9fa;
                                border-radius: 12px;
                                padding: 25px;
                                margin: 30px 0;
                            }
                            
                            .next-steps h4 {
                                color: #2c3e50;
                                margin-bottom: 15px;
                                font-size: 18px;
                                font-weight: 600;
                            }
                            
                            .next-steps ul {
                                list-style: none;
                                padding: 0;
                            }
                            
                            .next-steps li {
                                padding: 8px 0;
                                color: #5a6c7d;
                                position: relative;
                                padding-left: 25px;
                            }
                            
                            .next-steps li::before {
                                content: '✓';
                                position: absolute;
                                left: 0;
                                color: #28a745;
                                font-weight: bold;
                            }
                            
                            .support-section {
                                background: #e3f2fd;
                                border-radius: 12px;
                                padding: 25px;
                                margin: 30px 0;
                                text-align: center;
                            }
                            
                            .support-section h4 {
                                color: #1976d2;
                                margin-bottom: 10px;
                                font-size: 18px;
                                font-weight: 600;
                            }
                            
                            .support-section p {
                                color: #1565c0;
                                font-size: 14px;
                                margin-bottom: 15px;
                            }
                            
                            .support-email {
                                color: #1976d2;
                                text-decoration: none;
                                font-weight: 600;
                                padding: 8px 16px;
                                border: 2px solid #1976d2;
                                border-radius: 20px;
                                transition: all 0.3s ease;
                                display: inline-block;
                            }
                            
                            .support-email:hover {
                                background: #1976d2;
                                color: white;
                            }
                            
                            .footer {
                                background: #2c3e50;
                                color: white;
                                padding: 30px;
                                text-align: center;
                            }
                            
                            .footer-content {
                                max-width: 400px;
                                margin: 0 auto;
                            }
                            
                            .footer p {
                                font-size: 14px;
                                opacity: 0.8;
                                margin-bottom: 10px;
                            }
                            
                            .social-links {
                                margin: 20px 0;
                            }
                            
                            .social-links a {
                                color: white;
                                text-decoration: none;
                                margin: 0 10px;
                                font-size: 14px;
                                opacity: 0.8;
                                transition: opacity 0.3s ease;
                            }
                            
                            .social-links a:hover {
                                opacity: 1;
                            }
                            
                            .copyright {
                                font-size: 12px;
                                opacity: 0.6;
                                margin-top: 20px;
                                padding-top: 20px;
                                border-top: 1px solid rgba(255, 255, 255, 0.1);
                            }
                            
                            /* Responsive Design */
                            @media (max-width: 600px) {
                                body {
                                    padding: 10px;
                                }
                                
                                .email-wrapper {
                                    margin: 0;
                                    border-radius: 15px;
                                }
                                
                                .header {
                                    padding: 30px 20px;
                                }
                                
                                .header h1 {
                                    font-size: 24px;
                                }
                                
                                .content {
                                    padding: 30px 20px;
                                }
                                
                                .order-summary {
                                    padding: 20px;
                                }
                                
                                .order-details-grid {
                                    grid-template-columns: 1fr;
                                }
                                
                                .item-row {
                                    grid-template-columns: 1fr;
                                    gap: 10px;
                                    text-align: left;
                                }
                                
                                .footer {
                                    padding: 25px 20px;
                                }
                            }
                            
                            /* Dark mode support */
                            @media (prefers-color-scheme: dark) {
                                .email-wrapper {
                                    background: rgba(30, 30, 30, 0.95);
                                }
                                
                                .content {
                                    background: #1a1a1a;
                                    color: #e0e0e0;
                                }
                                
                                .greeting {
                                    color: #ffffff;
                                }
                                
                                .main-message {
                                    color: #b0b0b0;
                                }
                                
                                .order-summary {
                                    background: #2a2a2a;
                                    border-color: #404040;
                                }
                                
                                .detail-item {
                                    background: #333;
                                    border-color: #404040;
                                    color: #e0e0e0;
                                }
                                
                                .item-list {
                                    background: #2a2a2a;
                                    border-color: #404040;
                                }
                                
                                .item-row:nth-child(even) {
                                    background: #333;
                                }
                            }
                        </style>
                        </head>
                        <body>
                        <div class="email-wrapper">
                            <div class="header">
                                <h1>Order Confirmed!</h1>
                                <div class="subtitle">Thank you for choosing OpenCart</div>
                            </div>
                            
                            <div class="content">
                                <div class="greeting">Hi ${userName}!</div>
                                
                                <p class="main-message">
                                    Great news! We've received your order and our team is already preparing it for shipment. 
                                    Here are your order details:
                                </p>
                                
                                <div class="order-summary">
                                    <h3>Order Summary</h3>
                                    
                                    <div class="order-details-grid">
                                        <div class="detail-item">
                                            <div class="label">Order ID</div>
                                            <div class="value">#${orderDetails.orderId || 'N/A'}</div>
                                        </div>
                                        
                                        <div class="detail-item">
                                            <div class="label">Order Date</div>
                                            <div class="value">${orderDetails.orderDate || new Date().toLocaleDateString()}</div>
                                        </div>
                                        
                                        <div class="detail-item">
                                            <div class="label">Items</div>
                                            <div class="value">${orderDetails.itemCount || orderDetails.items?.length || 'N/A'}</div>
                                        </div>
                                        
                                        <div class="detail-item total">
                                            <div class="label">Total Amount</div>
                                            <div class="value">$${orderDetails.total?.toFixed(2) || '0.00'}</div>
                                        </div>
                                    </div>
                                    
                                    ${orderDetails.items ? `
                                    <div class="items-section">
                                        <h4>Items Ordered</h4>
                                        <div class="item-list">
                                            ${orderDetails.items.map(item => `
                                                <div class="item-row">
                                                    <div class="item-name">${item.name || 'Unknown Item'}</div>
                                                    <div class="item-qty">Qty: ${item.quantity || 1}</div>
                                                    <div class="item-price">$${(item.price || 0).toFixed(2)}</div>
                                                </div>
                                            `).join('')}
                                        </div>
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <div class="status-section">
                                    <h4>📦 Order Status</h4>
                                    <p>Your order is currently being processed and will be shipped within 1-2 business days.</p>
                                    ${orderDetails.trackingNumber ? `
                                    <div class="tracking-info">
                                        <strong>Tracking Number:</strong> ${orderDetails.trackingNumber}
                                    </div>
                                    ` : ''}
                                </div>
                                
                                <div class="next-steps">
                                    <h4>What happens next?</h4>
                                    <ul>
                                        <li>We'll process your order within 24 hours</li>
                                        <li>You'll receive a shipping confirmation with tracking details</li>
                                        <li>Your order will be delivered to your specified address</li>
                                        <li>We'll send you delivery updates along the way</li>
                                    </ul>
                                </div>
                                
                                <div class="support-section">
                                    <h4>Need Help?</h4>
                                    <p>Our customer support team is here to assist you with any questions about your order.</p>
                                    <a href="mailto:support@opencart.com" class="support-email">Contact Support</a>
                                </div>
                                
                                <p style="text-align: center; color: #6c757d; font-size: 16px; margin-top: 30px;">
                                    Thank you for your business! We appreciate your trust in OpenCart.
                                </p>
                            </div>
                            
                            <div class="footer">
                                <div class="footer-content">
                                    <p><strong>OpenCart</strong></p>
                                    <p>Your trusted e-commerce platform</p>
                                    
                                    <div class="social-links">
                                        <a href="#">Track Order</a>
                                        <a href="#">Returns</a>
                                        <a href="#">Help Center</a>
                                    </div>
                                    
                                    <div class="copyright">
                                        © ${new Date().getFullYear()} OpenCart. All rights reserved.
                                    </div>
                                </div>
                            </div>
                        </div>
                        </body>
                        </html>`;

                        // Generate text version for better email client support
                        const textContent = `
                        Order Confirmation - OpenCart

                        Hi ${userName}!

                        We've received your order and are now processing it.

                        Order Details:
                        - Order ID: #${orderDetails.orderId || 'N/A'}
                        - Order Date: ${orderDetails.orderDate || new Date().toLocaleDateString()}
                        - Total Amount: $${orderDetails.total?.toFixed(2) || '0.00'}

                        ${orderDetails.items ? `
                        Items Ordered:
                        ${orderDetails.items.map(item => `- ${item.name || 'Unknown Item'} (Qty: ${item.quantity || 1}) - $${(item.price || 0).toFixed(2)}`).join('\n')}
                        ` : ''}

                        Your order is currently being processed and will be shipped within 1-2 business days.

                        If you have any questions, please contact us at support@opencart.com

                        Thank you for choosing OpenCart!

                        © ${new Date().getFullYear()} OpenCart. All rights reserved.
                        `.trim();

                        return await this.sendEmail(userEmail, subject, htmlContent, textContent);
                        }
async sendTransactionNotification(userEmail, userName, transactionDetails) {
  const {
    transactionId,
    type,
    amount,
    description,
    date,
    balance,
    paymentMethod,
    currency = 'USD',
    merchantName,
    cardLast4,
    mpesaPhone,
    paypalEmail,
    stripeChargeId,
    status = 'completed',
    fee = 0,
    receiptUrl,
    refundDeadline,
    supportContact = 'support@opencart.com'
  } = transactionDetails;

  const isDebit = amount < 0;
  const isRefund = type.toLowerCase().includes('refund');
  const isPending = status.toLowerCase() === 'pending';
  
  // Payment method configurations
  const paymentMethods = {
    'stripe': {
      name: 'Stripe',
      icon: '💳',
      color: '#635bff',
      description: 'Secure card payment'
    },
    'mpesa': {
      name: 'M-Pesa',
      icon: '📱',
      color: '#00d13a',
      description: 'Mobile money transfer'
    },
    'paypal': {
      name: 'PayPal',
      icon: '🅿️',
      color: '#003087',
      description: 'Digital wallet payment'
    },
    'card': {
      name: 'Credit/Debit Card',
      icon: '💳',
      color: '#1a73e8',
      description: 'Bank card payment'
    },
    'bank': {
      name: 'Bank Transfer',
      icon: '🏦',
      color: '#34495e',
      description: 'Direct bank transfer'
    }
  };

  const currentMethod = paymentMethods[paymentMethod?.toLowerCase()] || paymentMethods.card;
  const primaryColor = isRefund ? '#17a2b8' : (isDebit ? '#dc3545' : '#28a745');
  const statusColor = isPending ? '#ffc107' : (status === 'failed' ? '#dc3545' : '#28a745');
  
  const subject = `${isRefund ? 'Refund' : 'Transaction'} ${status.charAt(0).toUpperCase() + status.slice(1)} - ${transactionId}`;
  
  const formatCurrency = (amount, currency) => {
    const absAmount = Math.abs(amount);
    const prefix = currency === 'USD' ? '$' : currency === 'KES' ? 'KSh ' : `${currency} `;
    return `${prefix}${absAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Transaction Notification</title>
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: #333;
          line-height: 1.6;
          padding: 20px;
          min-height: 100vh;
        }
        
        .email-wrapper {
          max-width: 650px;
          margin: 0 auto;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .header {
          background: linear-gradient(135deg, ${primaryColor} 0%, ${primaryColor}dd 100%);
          color: white;
          padding: 30px 20px;
          text-align: center;
          position: relative;
          overflow: hidden;
        }
        
        .header::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
          animation: shimmer 4s ease-in-out infinite;
        }
        
        @keyframes shimmer {
          0%, 100% { transform: rotate(0deg); }
          50% { transform: rotate(180deg); }
        }
        
        .header-content {
          position: relative;
          z-index: 1;
        }
        
        .header h1 {
          font-size: 28px;
          font-weight: 700;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
        }
        
        .transaction-icon {
          font-size: 32px;
          background: rgba(255, 255, 255, 0.2);
          padding: 8px;
          border-radius: 50%;
        }
        
        .status-badge {
          display: inline-block;
          background: ${statusColor};
          color: white;
          padding: 6px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 1px;
          margin-top: 8px;
        }
        
        .content {
          padding: 40px 30px;
          background: white;
        }
        
        .greeting {
          font-size: 22px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 20px;
        }
        
        .amount-section {
          text-align: center;
          margin: 30px 0;
          padding: 24px;
          background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
          border-radius: 16px;
          border: 2px solid ${primaryColor}20;
        }
        
        .amount {
          font-size: 42px;
          font-weight: 800;
          color: ${primaryColor};
          margin-bottom: 8px;
          font-family: 'Courier New', monospace;
        }
        
        .amount-label {
          font-size: 14px;
          color: #666;
          text-transform: uppercase;
          letter-spacing: 1px;
          font-weight: 600;
        }
        
        .transaction-details {
          background: #f8f9fa;
          border-radius: 12px;
          padding: 24px;
          margin: 24px 0;
        }
        
        .detail-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 12px 0;
          border-bottom: 1px solid #e9ecef;
        }
        
        .detail-row:last-child {
          border-bottom: none;
        }
        
        .detail-label {
          font-weight: 600;
          color: #495057;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        
        .detail-value {
          font-weight: 500;
          color: #2c3e50;
          text-align: right;
        }
        
        .payment-method {
          display: flex;
          align-items: center;
          gap: 12px;
          background: white;
          padding: 16px;
          border-radius: 12px;
          border: 2px solid ${currentMethod.color}20;
          margin: 20px 0;
        }
        
        .payment-icon {
          font-size: 24px;
          background: ${currentMethod.color}15;
          color: ${currentMethod.color};
          padding: 8px;
          border-radius: 50%;
          min-width: 40px;
          text-align: center;
        }
        
        .payment-info h3 {
          color: ${currentMethod.color};
          font-size: 16px;
          margin-bottom: 4px;
        }
        
        .payment-info p {
          color: #666;
          font-size: 14px;
        }
        
        .security-notice {
          background: ${isDebit ? 'linear-gradient(135deg, #fff5f5 0%, #fed7d7 100%)' : 'linear-gradient(135deg, #f0fff4 0%, #c6f6d5 100%)'};
          border-left: 4px solid ${isDebit ? '#e53e3e' : '#38a169'};
          padding: 16px;
          margin: 24px 0;
          border-radius: 8px;
          font-size: 14px;
        }
        
        .security-notice strong {
          color: ${isDebit ? '#c53030' : '#2f855a'};
        }
        
        .receipt-section {
          text-align: center;
          margin: 30px 0;
        }
        
        .receipt-button {
          display: inline-block;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          text-decoration: none;
          padding: 14px 28px;
          border-radius: 50px;
          font-weight: 600;
          font-size: 14px;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
        }
        
        .receipt-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        .balance-info {
          background: linear-gradient(135deg, #e8f5e8 0%, #c8e6c9 100%);
          padding: 20px;
          border-radius: 12px;
          margin: 20px 0;
          text-align: center;
        }
        
        .balance-label {
          font-size: 14px;
          color: #2e7d32;
          margin-bottom: 4px;
        }
        
        .balance-amount {
          font-size: 24px;
          font-weight: 700;
          color: #1b5e20;
          font-family: 'Courier New', monospace;
        }
        
        .support-section {
          background: linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%);
          border-radius: 12px;
          padding: 20px;
          margin: 24px 0;
          text-align: center;
        }
        
        .support-section h3 {
          color: #1565c0;
          margin-bottom: 8px;
          font-size: 18px;
        }
        
        .support-email {
          color: #1565c0;
          text-decoration: none;
          font-weight: 600;
        }
        
        .footer {
          background: #2c3e50;
          color: white;
          padding: 24px;
          text-align: center;
        }
        
        .footer-links {
          margin-bottom: 16px;
        }
        
        .footer-links a {
          color: #ecf0f1;
          text-decoration: none;
          margin: 0 12px;
          font-size: 14px;
        }
        
        .footer-links a:hover {
          color: ${primaryColor};
        }
        
        .copyright {
          font-size: 12px;
          color: #bdc3c7;
          border-top: 1px solid #34495e;
          padding-top: 16px;
        }
        
        @media (max-width: 600px) {
          .email-wrapper {
            margin: 10px;
            border-radius: 12px;
          }
          
          .content {
            padding: 24px 20px;
          }
          
          .header {
            padding: 24px 16px;
          }
          
          .amount {
            font-size: 32px;
          }
          
          .detail-row {
            flex-direction: column;
            align-items: flex-start;
            gap: 4px;
          }
          
          .detail-value {
            text-align: left;
          }
          
          .payment-method {
            flex-direction: column;
            text-align: center;
          }
        }
      </style>
    </head>
    <body>
      <div class="email-wrapper">
        <div class="header">
          <div class="header-content">
            <h1>
              <span class="transaction-icon">${isRefund ? '↩️' : (isDebit ? '💸' : '💰')}</span>
              ${isRefund ? 'Refund' : 'Transaction'} ${isPending ? 'Pending' : 'Completed'}
            </h1>
            <div class="status-badge">${status}</div>
          </div>
        </div>
        
        <div class="content">
          <div class="greeting">Hello ${userName}! 👋</div>
          
          <p style="margin-bottom: 20px; color: #555;">
            ${isPending ? 
              `Your ${type.toLowerCase()} is being processed and will be completed shortly.` :
              `Your ${type.toLowerCase()} has been ${status} successfully.`
            }
          </p>
          
          <div class="amount-section">
            <div class="amount">
              ${isDebit && !isRefund ? '-' : '+'}${formatCurrency(amount, currency)}
            </div>
            <div class="amount-label">
              ${isRefund ? 'Refund Amount' : 'Transaction Amount'}
            </div>
          </div>
          
          <div class="payment-method">
            <div class="payment-icon">${currentMethod.icon}</div>
            <div class="payment-info">
              <h3>${currentMethod.name}</h3>
              <p>${currentMethod.description}</p>
              ${cardLast4 ? `<p>Card ending in ••••${cardLast4}</p>` : ''}
              ${mpesaPhone ? `<p>M-Pesa: ${mpesaPhone}</p>` : ''}
              ${paypalEmail ? `<p>PayPal: ${paypalEmail}</p>` : ''}
            </div>
          </div>
          
          <div class="transaction-details">
            <div class="detail-row">
              <span class="detail-label">🆔 Transaction ID</span>
              <span class="detail-value">${transactionId}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📅 Date & Time</span>
              <span class="detail-value">${new Date(date).toLocaleString()}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">📝 Description</span>
              <span class="detail-value">${description}</span>
            </div>
            ${merchantName ? `
            <div class="detail-row">
              <span class="detail-label">🏪 Merchant</span>
              <span class="detail-value">${merchantName}</span>
            </div>` : ''}
            ${stripeChargeId ? `
            <div class="detail-row">
              <span class="detail-label">🔗 Stripe Charge ID</span>
              <span class="detail-value">${stripeChargeId}</span>
            </div>` : ''}
            ${fee > 0 ? `
            <div class="detail-row">
              <span class="detail-label">💳 Processing Fee</span>
              <span class="detail-value">${formatCurrency(fee, currency)}</span>
            </div>` : ''}
          </div>
          
          ${balance !== undefined ? `
          <div class="balance-info">
            <div class="balance-label">Current Account Balance</div>
            <div class="balance-amount">${formatCurrency(balance, currency)}</div>
          </div>` : ''}
          
          ${receiptUrl ? `
          <div class="receipt-section">
            <a href="${receiptUrl}" class="receipt-button">
              📄 Download Receipt
            </a>
          </div>` : ''}
          
          ${isDebit && !isRefund ? `
          <div class="security-notice">
            <strong>🛡️ Security Alert:</strong> If you did not authorize this transaction, 
            please contact our support team immediately at <a href="mailto:${supportContact}" style="color: #c53030;">${supportContact}</a>.
            ${refundDeadline ? `You have until ${new Date(refundDeadline).toLocaleDateString()} to dispute this transaction.` : ''}
          </div>` : ''}
          
          ${isRefund ? `
          <div class="security-notice">
            <strong>✅ Refund Processed:</strong> Your refund has been processed successfully. 
            Depending on your payment method, it may take 2-5 business days to appear in your account.
          </div>` : ''}
          
          <div class="support-section">
            <h3>Need Help? 🤝</h3>
            <p>Our support team is available 24/7 to assist you!</p>
            <a href="mailto:${supportContact}" class="support-email">
              📧 ${supportContact}
            </a>
          </div>
          
          <p style="color: #666; font-size: 14px; margin-top: 30px;">
            Thank you for choosing OpenCart! We're committed to providing you with 
            secure and reliable payment processing.
          </p>
        </div>
        
        <div class="footer">
          <div class="footer-links">
            <a href="#">Transaction History</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Help Center</a>
          </div>
          <div class="copyright">
            © ${new Date().getFullYear()} OpenCart. All rights reserved.<br>
            This notification was sent to ${userEmail}
          </div>
        </div>
      </div>
    </body>
    </html>
  `;
  
  return await this.sendEmail(userEmail, subject, htmlContent);
}
 }


export default EmailService;