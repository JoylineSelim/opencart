import user from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import logger from '../utils/logger.js'
import { generateAccessToken,generateRefreshToken } from "../utils/tokenService.js";
import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID)

//Register a new User
export const registerUser = async (req,res) =>{
    try {
        const {email,password,firstName,lastName,phone} = req.body

        if(!email || !password || !firstName || !lastName || !phone){
            return res.status(400).json({message:"Provide all fields"})
        }
        //const confirmPassword = async
        const existingUser = await user.findOne({email})
        if(existingUser){
            res.status(400).json({message:"Email is linked to an account"})

        }

        const newUser = await user.create({
            email,password,firstName,lastName,phone
        })

        const verificationToken= newUser.createEmailVerificationToken();
        await newUser.save()

        //send email to verify user
        await sendEmail({
            to: email,
            subject:"Verify Your Email",
            text: `You have received this email because you have signed up to Open Cart. Here is your Verification token: ${verificationToken}. If this was not you please ignore this email. Do not share you token with anyone as this can lead to account breach`

        })
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
        const user = await findOne({email}).select('+password')

        if (!user || !(await user.comparePassword(password))){
            return res.status(400),json({message:"Invalid credentials"})
        }
        
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);

        user.refreshToken.push({ token: refreshToken });
        await user.save()

        res.status(200).json({
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role},
        message:"Login Successful"
        })
    } catch (error) {
        logger.error("Login attempt failed",{error})
        res.status(500).json({message:"Server Error"})
        
    }

}


//Get the User Profile
export const getUserProfile = async (req,res) =>{
    try {
        const user = await User.findById(req.user.id).select('-password -refreshToken -twoFactorSecret')

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
        const user = await User.findOne(email)

        if(!user) return res.status(404).json({message:"Email is not linked to any account. Please sign up"})
        const resetToken = user.createPasswordResetToken();
        await user.Save()

        await sendEmail({
            to: email,
            subject:"Password Reset Email",
            text:`This email contains your password reset token. Kindly do not share this with anyone as it would compromise your account. If you did not request for a password change please consider changing your password. Here is your reset token ${resetToken}`
        })
    } catch (error) {
        logger.error("Error in resetting your password",{error})
        res.status(500).json({message:"Server error while resetting your password. Please try again later."})

    }
}


//Reset password after clicking on forgot password
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

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
    res.status(500).json({ message: 'Error resetting password' });
  }
};

//verify the user's email
export const verifyEmail = async (req,res) =>{
    try {
    const {token} = req.body
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex')

    const user = await User.findOne({createEmailVerificationToken:hashedToken})
    if(!user) return res.status(404).json({message:"invalid or expired token"})

    user.isEmailVerified =true
    user.emailVeriricationToken = undefined
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
