const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const CarOwner = require('../models/carOwner');
const GarageManager = require('../models/garageManager');
const GarageStaff = require('../models/garageStaff');
const Admin = require('../models/admin');
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
    return jwt.sign({ _id: user._id, role: user.role }, process.env.JWT_SECRET_KEY, { expiresIn: '1h' });
};

const registerCarOwner = async (userData) => {
    const { name, email, password, phone, role } = userData;

    if (role !== 'carOwner') {
        throw new Error('Invalid role for car owner registration');
    }

    const existingUser = await CarOwner.findOne({ email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new CarOwner({
        name,
        email,
        password: hashedPassword,
        phone,
        verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(newUser, verificationToken);
    return newUser;
};

const registerGarageOwner = async (userData) => {
    const { name, email, password, phone, garageName, role } = userData;

    if (role !== 'garageOwner') {
        throw new Error('Invalid role for garage owner registration');
    }

    const existingUser = await GarageManager.findOne({ email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);
    const verificationToken = crypto.randomBytes(32).toString('hex');

    const newUser = new GarageManager({
        name,
        email,
        password: hashedPassword,
        phone,
        garageName,
        verificationToken,
    });

    await newUser.save();
    await sendVerificationEmail(newUser, verificationToken);
    return newUser;
};

const registerGarageStaff = async (userData, garageOwnerId) => {
    const { name, email, password, phone } = userData;

    const garageOwner = await GarageManager.findById(garageOwnerId);
    if (!garageOwner) throw new Error('Only a garage owner can create garage staff');

    const existingUser = await GarageStaff.findOne({ email });
    if (existingUser) throw new Error('Email already exists');

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new GarageStaff({
        name,
        email,
        password: hashedPassword,
        phone,
    });

    await newUser.save();
    return newUser;
};

const login = async (email, password) => {
    const user = await CarOwner.findOne({ email }) ||
        await GarageManager.findOne({ email }) ||
        await GarageStaff.findOne({ email }) ||
        await Admin.findOne({ email });

    if (!user) throw new Error('Invalid email or password');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new Error('Invalid email or password');

    if (!user.isVerified) throw new Error('Please verify your email first');

    const token = generateToken(user);
    return { user, token };
};

const verifyEmail = async (token) => {
    const user = await CarOwner.findOne({ verificationToken: token }) ||
        await GarageManager.findOne({ verificationToken: token });

    if (!user) throw new Error('Invalid or expired token');

    user.isVerified = true;
    user.verificationToken = undefined;
    await user.save();
    return user;
};

module.exports = { registerCarOwner, registerGarageOwner, registerGarageStaff, login, verifyEmail };