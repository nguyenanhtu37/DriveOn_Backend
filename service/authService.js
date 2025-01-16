const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const sgMail = require('@sendgrid/mail');

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

module.exports = { sendVerificationEmail, generateToken, registerCarOwner };