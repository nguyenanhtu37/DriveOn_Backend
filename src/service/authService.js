import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import redis from "../config/redis.js";
import transporter from "../config/mailer.js";
import User from "../models/user.js";
import Role from "../models/role.js";
import {
  validateLogin,
  validateResetPassword,
  validateSignup,
} from "../validator/authValidator.js";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:5000";
const FRONTEND_URL = process.env.FRONTEND_URL || "http://localhost:5173";

const signup = async (userData) => {
  // Validate userData
  validateSignup(userData);
  const { email, password, name, phone, roles, avatar } = userData;
  // check email da ton tai chua
  const existingUser = await User.findOne({ email });
  if (existingUser) throw new Error("Email already exists");
  // hash pass
  const hashedPassword = await bcrypt.hash(password, 10);
  // tao token verify
  const token = jwt.sign(
    { email, password: hashedPassword, name, phone, roles, avatar },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  // luu token vao redis (key: email, value: token)
  await redis.setex(email, 900, token); // 15'
  // gui mail xminh
  const link = `${BACKEND_URL}/api/auth/verify?token=${token}`;
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
  if (!storedToken || storedToken !== token)
    throw new Error("Invalid or expired token");
  // tim role mac dinh tu db
  const defaultRole = await Role.find({
    roleName: { $in: ["carowner", "manager"] },
  });
  if (!defaultRole || defaultRole.length < 2) {
    throw new Error("Default role not found");
  }
  // luu data vào db
  const user = new User({
    email: payload.email,
    password: payload.password,
    name: payload.name,
    phone: payload.phone,
    roles: defaultRole.map((role) => role._id),
    avatar: payload.avatar,
  });
  await user.save();
  return { message: "Email verified successfully" };
};

const login = async (email, password) => {
  // validate input
  validateLogin(email, password);
  // find user by email
  const user = await User.findOne({ email })
    .populate("roles")
    .populate("garageList");
  if (!user) throw new Error("Invalid email or password");
  // check status
  if (user.status !== "active") throw new Error("Account is not active");
  // check pass
  // nếu là đăng nhập qua Google (không có mật khẩu), bỏ qua so sánh mật khẩu
  if (password && user.password) {
    const isMatch = await bcrypt.compare(password, user.password);
    console.log(isMatch);
    if (!isMatch) throw new Error("Invalid email or password");
  }
  // tao jwt token
  const token = jwt.sign(
    {
      id: user._id,
      email: user.email,
      roles: user.roles.map((role) => role.roleName),
    },
    process.env.JWT_SECRET,
    { algorithm: "HS256", expiresIn: "1h" }
  );
  console.log(
    `User ID: ${user._id}, Email: ${user.email}, Roles: ${user.roles.map(
      (role) => role.roleName
    )}`
  );
  return { user, token };
};

const requestPasswordReset = async (email) => {
  // find usre by email
  const user = await User.findOne({ email });
  if (!user) throw new Error("User does not exist!");
  // tao token reset pass
  const token = jwt.sign(
    { id: user._id, email: user.email },
    process.env.JWT_SECRET,
    { expiresIn: "15m" }
  );
  // luu token vao redis (key: email, value: token)
  await redis.setex(email, 900, token); // 15'
  const checkToken = await redis.get(email);
  console.log("Token saved in Redis:", checkToken);
  // gui mail reset
  const link = `${FRONTEND_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: email,
    subject: "DriveOn password reset",
    html: `
  <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f4f7; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; background: #fff; padding: 30px; border-radius: 8px; box-shadow: 0 0 10px rgba(0,0,0,0.05);">
      <h2 style="color: #4F46E5;">🔐 DriveOn Password Reset</h2>
      <p>Xin chào <strong>${user.name || user.email}</strong>,</p>
      <p>Chúng tôi đã nhận được yêu cầu đặt lại mật khẩu cho tài khoản DriveOn của bạn.</p>
      <p>Nhấn vào nút bên dưới để tiếp tục:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${link}" style="display: inline-block; background-color: #4F46E5; color: #fff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">
          Đặt lại mật khẩu
        </a>
      </div>
      <p>Nếu bạn không yêu cầu thao tác này, vui lòng bỏ qua email này.</p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
      <p style="font-size: 12px; color: #888;">Liên hệ DriveOn nếu bạn cần hỗ trợ thêm.</p>
    </div>
  </div>
`
  });
  return { message: "Password reset email sent" };
};

const resetPassword = async (token, newPassword) => {
  try {
    // Validate input
    validateResetPassword(token, newPassword);
    // Verify token
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // Check token trong redis
    const storedToken = await redis.get(payload.email);
    console.log("Stored token:", storedToken);
    console.log("Payload:", payload);
    if (!storedToken || storedToken !== token) {
      throw new Error("Invalid or expired token");
    }
    // Hash password mới
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    // Update password
    await User.findByIdAndUpdate(payload.id, {
      password: hashedPassword,
      updatedAt: new Date(),
    });
    // Xóa token trong redis sau khi reset thành công
    await redis.del(payload.email);
    return { message: "Password reset successfully" };
  } catch (error) {
    throw new Error(error.message);
  }
};

const logout = async (token) => {
  // giai ma token
  const payload = jwt.verify(token, process.env.JWT_SECRET);
  console.log("Before delete token:", payload);
  // xoa token trong redis
  await redis.del(payload.email);
  const tokenAfterDelete = await redis.get(payload.email);
  console.log("After delete token:", tokenAfterDelete);
  if (tokenAfterDelete) {
    throw new Error("Failed to delete token");
  }
  return { message: "Logout successfully" };
};

const googleLogin = async (token) => {
  try {
    // xac thuc token google
    const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    // lay thong tin tu payload
    let payload = ticket.getPayload();
    console.log("Google login payload:", payload);
    const {
      email,
      name,
      sub,
      email_verified,
      picture,
      locale,
      given_name,
      family_name,
    } = payload;
    // tim user theo email va googleId
    let user = await User.findOne({ email, googleId: sub })
      .populate("roles")
      .populate("garageList");
    // neu k ton tai thi tao moi
    if (!user) {
      console.log("User not found, creating new user...");
      // tim role mac dinh tu db
      const defaultRole = await Role.find({
        roleName: { $in: ["carowner", "manager"] },
      });
      if (!defaultRole || defaultRole.length < 2) {
        throw new Error("Default role not found");
      }
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
        familyName: family_name,
        roles: defaultRole.map((role) => role._id),
      });
      await user.save();
      console.log("New user created:", user);
    }
    // tao jwt token
    const jwtToken = jwt.sign(
      {
        id: user._id,
        email: user.email,
        roles: user.roles.map((role) => role.roleName),
      },
      process.env.JWT_SECRET,
      { algorithm: "HS256", expiresIn: "1h" }
    );
    // tra ve token
    console.log("User logged in:", user);
    console.log("Generated JWT token: \x1b[32m%s\x1b[0m", jwtToken);
    return { token: jwtToken };
  } catch (error) {
    console.error("Error during Google login:", error);
    throw new Error("Google login failed");
  }
};

export {
  signup,
  verifyEmail,
  login,
  requestPasswordReset,
  resetPassword,
  logout,
  googleLogin,
};
