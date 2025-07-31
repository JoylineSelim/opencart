import User from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import logger from '../utils/logger.js'
import { generateAccessToken,generateRefreshToken } from "../utils/tokenService.js";
import { OAuth2Client } from "google-auth-library";
import EmailService from "../Services/emailService.js";
import rateLimit from "express-rate-limit";

const emailingService = new EmailService({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    email: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
    secure: process.env.EMAIL_SECURE === 'true', 
    fromName: 'OpenCart Support',
    baseURL : process.env.BASE_URL || 'http://localhost:5000'
});
const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//Register a new User
export const registerUser = async (req,res) =>{
    try {
        const {email,password,firstName,lastName,phone} = req.body

        if(!email || !password || !firstName || !lastName || !phone){
            return res.status(400).json({message:"Provide all fields"})
        }
        //const confirmPassword = async
        const existingUser = await User.findOne({email})
        if(existingUser){
          return  res.status(400).json({message:"Email is linked to an account"})

        }

        const newUser = await User.create({
            email,password,firstName,lastName,phone
        })

        const verificationToken= crypto.randomBytes(32).toString('hex');
        newUser.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
        newUser.emailVerificationExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes
        await newUser.save()

        //send email to verify user
         await emailingService.registrationConfirmation(
            newUser.email,
            newUser.firstName,
            verificationToken
         )
        res.status(201).json({mesaage:"User created successfully. Check email for verification link"})


    } catch (error) {
        logger.error("User registration failed",{error})
        res.status(500).json({message:"Encountered error adding user"})

    }
}

//Login User
export const loginUser = async (req,res) =>{
    try {
        const {email,password} = req.body
        const existingUser = await User.findOne({email}).select('+password')

        if (!existingUser || !(await existingUser.comparePassword(password))){
            return res.status(400).json({message:"Invalid credentials"})
        }
        
        const accessToken = generateAccessToken(User);
        const refreshToken = generateRefreshToken(User);

        existingUser.refreshToken.push({ token:refreshToken });
        await existingUser.save()

        res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id:existingUser._id,
        email:existingUser.email,
        firstName:existingUser.firstName,
        lastName:existingUser.lastName,
        role:existingUser.role},
        message:"Login Successful"
        })
    } catch (error) {
        logger.error("Login attempt failed",{error})
        logger.error("Login attempt failed", { error: error.message || error });
        res.status(500).json({message:"Server Error"})
        
    }

}


//Get the User Profile
export const getUserProfile = async (req,res) =>{
    try {
        const user = await user.findById(req.user.id).select('-password -refreshToken -twoFactorSecret')

        if (!user) return res.status(404).json({message:"User not found"})
        
        res.status(200).json({user})
    } catch (error) {
        logger.error("Error attempting to find User",{error})
        res.status(500).json({message:"Server Error trying to find User"})
    }
    
}

export const forgotPassword = async (req,res) =>{
    try {
        const {email} = req.body
        if(!email) return res.status(400).json({message:"Please provide an email address"})

         const existingUser = await User.findOne({email})
        if(!existingUser) return res.status(404).json({message:"Email is not linked to any account. Please sign up"})
        console.log("User found, proceeding to send reset link")
        
        const resetToken = crypto.randomBytes(32).toString('hex');
        existingUser.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        existingUser.passwordResetExpires = Date.now() + 10 * 60 * 1000; // Token valid for 10 minutes
        console.log("Reset token generated and saved to user model")

        await existingUser.save({validateBeforeSave: false});
        console.log("User model updated with reset token, proceeding to send email")

        await emailingService.passwordReset(
            existingUser.email,
            existingUser.firstName,
            resetToken,
            
        )
        console.log("Password reset email sent successfully")
        res.status(200).json({message:"Password reset link sent to your email. Please check your inbox"})
    } catch (error) {
        console.error("Error in forgot password flow", error);
        logger.error("Error in resetting your password",{error})
        res.status(500).json({message:"Server error while resetting your password. Please try again later."})
    }
}


//Reset password after clicking on forgot password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      return res.status(400).json({ message: 'Token and new password are required' });
    }
    if (newPassword.length < 8) {
      return res.status(400).json({ message: 'New password must be at least 8 characters long' });
    }
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() }
  
    });

    if (!user) return res.status(400).json({ message: 'Token is invalid or has expired' });

    user.password = newPassword; 
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;

    await user.save();

    res.status(200).json({ message: 'Password reset successful. You can now log in.' });
  } catch (error) {
    logger.error("Error in resetting password", { error });
    logger.error("Error in resetting password", { error: error.message || error });
    res.status(500).json({ message: 'Error resetting password' });
  }
};

//verify the user's email
export const verifyEmail = async (req,res) =>{
    try {
    const {token} = req.body
    if(!token) return res.status(400).json({message:"No verification token provided"})
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({
      emailVerificationToken:hashedToken,
      emailVerificationExpires: { $gt: Date.now() }
    });
    if(!user) return res.status(404).json({message:"invalid or expired token"})

    user.isEmailVerified =true
    user.emailVerificationToken= undefined
    user.emailVerificationExpires = undefined

    await user.save()

    res.status(200).json({message:"Email verified successfully"})

        
    } catch (error) {
    logger.error("Error trying to verify email",{error}) 
    res.status(500).json({message:"Server error attempting to verify email. Try again later."})
    }
    
}


//Update a user's profile
export const updateProfile = async (req,res) =>{
    try {
        const updates = {...req.body}
        delete updates.password

        const user = await User.findByIdAndUpdate(req.user.id,updates,{new:true}).select('-password')
        if(!User) return res.status(404).json({message:"User not found"})
        
        res.json({user})


    } catch (error) {
    logger.error("Error in updating user profile")
    res.status(500).json({message:"Server error trying to update User Profile. Try again later"})
        
    }
    
}

//User updates Password when logged in
export const updatePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const user = await User.findById(req.user.id).select('+password');

    const isMatch = await user.comparePassword(oldPassword); 
    if (!isMatch) return res.status(401).json({ message: 'Old password is incorrect' });

    user.password = newPassword;
    await user.save();

    res.status(200).json({ message: 'Password updated successfully' });
    
  } catch (error) {
    res.status(500).json({ message: 'Could not update password' });
  }
};


//logout 
// @desc    Logout user
// @route   POST /api/users/logout
// @access  Private
export const logoutUser = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Remove token from current device
    const tokenToRemove = req.body.refreshToken;
    user.refreshToken = user.refreshToken.filter(rt => rt.token !== tokenToRemove);

    await user.save();

    res.status(200).json({ message: 'Logged out successfully' });
  } catch (error) {
    logger.error('Logout failed', { error });
    res.status(500).json({ message: 'Logout failed' });
  }
};


//Refresh token endpoint
export const refreshAccessToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) return res.status(401).json({ message: 'Refresh token required' });

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const tokenExists = user.refreshToken.find(rt => rt.token === refreshToken);
    if (!tokenExists) return res.status(403).json({ message: 'Invalid refresh token' });

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken(user);

    // Optionally rotate the token
    user.refreshToken = user.refreshToken.filter(rt => rt.token !== refreshToken);
    user.refreshToken.push({ token: newRefreshToken });
    await user.save();

    res.status(200).json({
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired refresh token' });
  }
};


//google login endpoint
export const googleLogin = async (req, res) => {
  const { idToken } = req.body;

  if (!idToken) return res.status(400).json({ message: 'ID token is required' });

  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub } = payload;

    let user = await User.findOne({ email });

    if (!user) {
      // Register new user
      user = await User.create({
        email,
        firstName: given_name,
        lastName: family_name,
        password: sub, // Placeholder, won't be used
        isEmailVerified: true,
      });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token
    user.refreshToken.push({ token: refreshToken });
    await user.save();

    res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    });

  } catch (error) {
    console.error('Google login error:', error);
    res.status(401).json({ message: 'Invalid Google ID token' });
  }
};

export const createTestVerificationToken = async (req,res) => {
  try {
    const {email} = req.body
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    
    // Find user and set verification token
    const user = await User.findOne({ email });
    if (!user) {
      throw new Error('User not found');
    }
    
    user.emailVerificationToken = hashedToken;
    user.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000; // 24 hours
    user.isEmailVerified = false;
    
    await user.save();
    
    console.log('Test verification setup complete:');
    console.log('Email:', email);
    console.log('Token to use in API call:', token);
    console.log('Hashed token in DB:', hashedToken);
    res.status(200).json({
      message: 'Test verification token created successfully',
      token,
      hashedToken
    });
    return { token, hashedToken };
  } catch (error) {
    console.error('Error creating test token:', error);
    res.status(500).json({ message: 'Error creating test verification token' });
  }
};
/*
export const resendVerificationEmail = async (req, res) => {
    const resendLimit = rateLimit({
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 3, // Limit each IP to 3 requests per windowMs
        message: 'Too many requests, please try again later.',
        standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
        legacyHeaders: false, // Disable the `X-RateLimit-*` headers

    }

    )
    const user = await User.findById(req.user.id)
    */