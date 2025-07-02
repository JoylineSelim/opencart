import express from 'express'
import { 
    registerUser,
    loginUser,
    forgotPassword,
    getUserProfile,
    verifyEmail,
    updateProfile,
    logoutUser

 } from "../Controllers/userController.js"
 import {protect} from '../middleware/authMiddleware.js';

const router = express.Router()

router.post('/register', registerUser);
router.post('/login', loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateProfile);
router.post('/forgotPassword', forgotPassword);
router.post('/verifyEmail', verifyEmail);
router.post('/logout',logoutUser)

 export default router