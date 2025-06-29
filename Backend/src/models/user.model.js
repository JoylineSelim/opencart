import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const userSchema = new mongoose.Schema({
    email:{
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true,
        
    },
    password: {
        type: String,
        required:true,
        minlength: 8,
        select: false,
    },
    firstName:{
        type: String,
        required: true,
        trim: true,
    },
    lastName:{
        type: String,
        required: true,
        trim: true,
    },
    phone:{
        type: String,
        trim: true,
    },
    stripeCustomerId:{
        type: String,
        unique: true,
        sparse: true, 
    },
    role:{
        type: String,
        enum: ['user', 'admin'],
        default: 'user',
    },
    isEmailVerified: {
        type: Boolean,
        default: false,
    },
    isTwoFactorEnabled: {
        type: Boolean,
        default: false,
    },
    twoFactorSecret: {
        type: String,
        select: false,
    },
    refreshToken:[{
        token:String,
        createdAt: {
            type: Date,
            default: Date.now,
            expires: '7d',
        },
    }],
    passwordResetToken: {
        type: String,
        select: false,
    },
    passwordResetExpires: {
        type: Date,
    },
    emailVerificationToken:String,
    loginAttempts:{
        type: Number,
        default: 0,
    },
    lockUntil: {
        type: Date,
        default: Date.now,
    }},
    {
    timestamps: true,
    }


);
//INDEXES
userSchema.index({ email: 1 });
userSchema.index({ stripeCustomerId: 1 });

//password hashing middleware
userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    
    try {
        const salt = await bcrypt.genSalt(10);
        this.password = await bcrypt.hash(this.password, salt);
        next();
    } catch (error) {
        next(error);
        
    }

})

//instance methods
userSchema.methods.comparePassword = async function(candidatePassword) {
    try {
        return await bcrypt.compare(candidatePassword, this.password);
    } catch (error) {
        throw new Error('Password comparison failed');
    }
}

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');
    this.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
}

userSchema.methods.createEmailVerificationToken = function() {
    const verificationToken = crypto.randomBytes(32).toString('hex');
    this.emailVerificationToken = crypto.createHash('sha256').update(verificationToken).digest('hex');
    
    return verificationToken;
}
export default mongoose.model('User', userSchema);