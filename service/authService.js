import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';
import redis from '../config/redis.js';
import transporter from '../config/mailer.js';
import User from '../models/user.js';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

const signup = async (userData) => {
  const { email, password, name, phone, coinBalance, vehicles, roles, bankAccount } = userData;
  // check email da ton tai chua
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already exists");
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
  return { message: "Verification email sent" };
};

const verifyEmail = async (token) => {
  // giai ma token
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // check token co ton tai trong redis k
  const storedToken = await redis.get(payload.email);
  if (!storedToken || storedToken !== token) throw new Error("Invalid or expired token");
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
  await user.save();
  return { message: "Email verified successfully" };
};

const login = async (email, password) => {
  // find user by id
  const user = await User.findOne({ email }).populate('roles');
  if (!user) throw new Error("Invalid email or password");
  // check pass
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw new Error("Invalid email or password");
  // check status
  if (user.status !== "active") throw new Error("Account is not active");
  // tao jwt token
  const token = jwt.sign({ id: user._id, email: user.email, roles: user.roles.map(role => role.roleName) }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return { token };
};

const requestPasswordReset = async (email) => {
  // find usre by email
  const user = await User.findOne({ email });
  if (!user) throw new Error("User does not exist!");
  // tao token reset pass
  const token = jwt.sign({ id: user._id, email: user.email }, process.env.JWT_SECRET, { expiresIn: "15m" });
  // luu token vao redis (key: email, value: token)
  await redis.setex(email, 900, token); // 15'
  // gui mail reset
  const link = `http://localhost:${process.env.PORT}/api/auth/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "DriveOn password reset",
    html: `<p>Click <a href="${link}">here</a> to reset your password.</p>`,
  });
  return { message: "Password reset email sent" };
};

const resetPassword = async (token, newPassword) => {
  // giai ma token
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // check token trong redis co ton tai k
  const storedToken = await redis.get(payload.email);
  if (!storedToken || storedToken !== token) throw new Error("Invalid or expired token");
  // hash new pass
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // update new pass
  await User.findByIdAndUpdate(payload.id, { password: hashedPassword });
  return { message: "Password reset successfully" };
};

const logout = async (token) => {
  // giai ma token
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  // xoa token trong redis
  await redis.del(payload.email);
  return { message: "Logout successfully" };
};

const googleLogin = async (token) => {
  try {
    // xac thuc token gg
    const ticket = await client.verifyIdToken({ // google-auth-library xac thuc token gg
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload(); // lay thong tin nguoi dung tu token da xac thuc
    const { email, name, sub, email_verified, picture, locale, given_name, family_name } = payload;

    // tim nguoi dung theo email va googleId co ton tai trong db k
    let user = await User.findOne({ email, googleId: sub });
    if (!user) {
      console.log("User not found, creating new user...");
      // tao moi neu chua co
      user = new User({
        email,
        name,
        googleId: sub,
        status: "active",
        createdAt: new Date(),
        updatedAt: new Date(),
        emailVerified: email_verified,
        avatar: picture,
        locale,
        givenName: given_name,
        familyName: family_name
      });
      await user.save();
      console.log("New user created:", user);
    }

    // tao jwt token
    const jwtToken = jwt.sign(
      { id: user._id, email: user.email, roles: user.roles.map(role => role.roleName) },
      process.env.JWT_SECRET,
      { algorithm: 'HS256', expiresIn: "1h" } 
    );

    return { token: jwtToken };
  } catch (error) {
    console.error("Error during Google login:", error);
    throw new Error("Google login failed");
  }
};

export { signup, verifyEmail, login, requestPasswordReset, resetPassword, logout, googleLogin };