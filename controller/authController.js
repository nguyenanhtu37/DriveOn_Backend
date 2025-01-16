import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import redis from '../config/redis.js';
import transporter from '../config/mailer.js';
import User from '../models/user.js';

const signup = async (req, res) => {
  const { email, password, name, phone, coinBalance, vehicles, roles, bankAccount } = req.body;
  try {
    // check email da ton tai chua
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: "Email already exists" });
    // hash pass
    const hashedPassword = await bcrypt.hash(password, 10);
    // tao token verify
    const token = jwt.sign({ email, password: hashedPassword, name, phone, coinBalance, vehicles, roles, bankAccount }, process.env.JWT_SECRET, { expiresIn: "15m" });
    // luu token vao redis (key: email, value: token)
    await redis.setex(email, 900, token); // 15'
    // gui mail xminh
    const link = `http://localhost:${process.env.PORT}/api/auth/verify?token=${token}`;
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: email,
      subject: "DriveOn register verification",
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
          <p style="font-size: 18px; margin-bottom: 10px;">Thank you for registering with <strong>DriveOn!</strong></p>
          <p style="font-size: 16px; margin-bottom: 20px;">
            Please click 
            <a href="${link}" style="color: #007BFF; text-decoration: none; font-weight: bold;">here</a> 
            to verify your account and complete your registration process.
          </p>
          <p style="font-size: 14px; font-style: italic; color: #777;">Best regards,</p>
          <p style="font-size: 14px; font-weight: bold;">DriveOn Team</p>
        </div>
      `,
    });
    res.status(200).json({ message: "Verification email sent" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const verifyEmail = async (req, res) => {
  const { token } = req.query;
  try {
    // giai ma token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // check token co ton tai trong redis k
    const storedToken = await redis.get(payload.email);
    if (!storedToken || storedToken !== token) return res.status(400).json({ message: "Invalid or expired token" });
    // luu data vào db
    const user = new User({
      email: payload.email,
      password: payload.password,
      name: payload.name,
      phone: payload.phone,
      coinBalance: payload.coinBalance || 0,
      vehicles: payload.vehicles || [],
      roles: payload.roles || [],
      bankAccount: payload.bankAccount || 0,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log(user);
    await user.save();
    res.status(200).json({ message: "Email verified successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { signup, verifyEmail };