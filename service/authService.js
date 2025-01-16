const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Role = require('../models/role');
const User = require('../models/user');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendVerificationEmail = async (user, token) => {
    const msg = {
        to: user.email,
        from: process.env.EMAIL_USER,
        subject: 'Email Verification',
        text: `Please verify your email by clicking the following link: ${process.env.BASE_URL}/api/auth/verify-email?token=${token}`,
    };
    await sgMail.send(msg);
};

const generateToken = (user) => {
    return jwt.sign({ _id: user._id, roles: user.roles }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};

const registerUser = async (userData) => {
    const { name, email, password, phone, roleName } = userData;

    const existingUser = await User.findOne({ email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    // Convert role names to ObjectId values

    const newUser = new User({
        name,
        email,
        password: hashedPassword,
        phone,
        roleName: Array.isArray(roleName) ? roleName : [roleName],

        verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(newUser, verificationToken);
    return newUser;
};

const login = async (email, password) => {
    const user = await User.findOne({ email });

    if (!user) throw new Error('Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    if (!user.isVerified) throw new Error('Please verify your email first');

    const token = generateToken(user);
    return { user, token };
};

const verifyEmail = async (token) => {
    const user = await User.findOne({ verificationToken: token });

    if (!user) throw new Error('Invalid or expired token');

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return user;
};
module.exports = { registerUser, login, verifyEmail };