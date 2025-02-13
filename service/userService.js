import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import User from '../models/user.js';

const changePassword = async (userId, oldPassword, newPassword) => {
  // tìm người dùng theo ID
  const user = await User.findById(userId);
  if (!user) throw new Error("User not found");
  // check mật khẩu cũ
  const isMatch = await bcrypt.compare(oldPassword, user.password);
  if (!isMatch) throw new Error("Old password is incorrect");
  // hash mật khẩu mới
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  // updatee mật khẩu mới
  user.password = hashedPassword;
  await user.save();
  return { message: "Password changed successfully" };
};

const viewPersonalProfile = async (userId) => {
  if (!userId) {
    throw new Error("User not found");
  }
  const user = await User.findById(userId);
  return user;
}

export { changePassword, viewPersonalProfile };