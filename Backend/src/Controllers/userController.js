import user from "../models/user.model.js";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";
import logger from '..utils/logger.js'

//Assist user sigin
const generateToken = (user) =>{
    return jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{
        expiresIn: '7d'
    })
}

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

        if (!user){
            return res.status(400),json({message:"Invalid email or username"})
        }
        const isMatch = await user.comparePassword(password);
        if(!isMatch) return res.staus(400).json({message:"Invalid Password"})
        
        const token = generateToken(user)
        res.status(200).json({message:"Login Successful"})
    } catch (error) {
        logger.error("Login attempt failed",{error})
        res.status(500).json({message:"Server Error"})
        
    }

}

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