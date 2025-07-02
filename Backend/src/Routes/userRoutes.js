import express from 'express'
import { 
    registerUser,
    loginUser,
    forgotPassword,
    resetPassword,
    getUserProfile,
    verifyEmail,
    updateProfile,
    updatePassword,
    refreshAccessToken,
    googleLogin,
    logoutUser

 } from "../Controllers/userController.js"
 import {protect} from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile/get-profile', protect, getUserProfile);
router.put('/profile/update', protect, updateProfile);
router.put('/profile/password/update',protect,updatePassword)
router.post('/password/forgot', forgotPassword);
router.post('/password/reset',resetPassword)
router.post('/email/verify', verifyEmail);
router.post('/refresh-token', refreshAccessToken);
router.post('/logout',protect,logoutUser)
router.post('/google-login',googleLogin)

 export default router