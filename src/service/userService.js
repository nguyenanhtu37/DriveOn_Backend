import bcrypt from 'bcrypt';
import User from '../models/user.js';
import { validateUserData, validateUpdateProfile, validateChangePassword } from '../validator/userValidator.js';

const changePassword = async (userId, oldPassword, newPassword) => {
  // Validate dữ liệu
  validateChangePassword(oldPassword, newPassword);
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
  try {
    const user = await User.findById(userId);
    // Validate kết quả
    return validateUserData(user);
  } catch (error) {
    throw new Error(error.message);
  }
};

const updatePersonalProfile = async (userId, userData) => {
  try {
    // Validate userData
    validateUpdateProfile(userData);
    const user = await User.findById(userId);
    if (!user) throw new Error("User not found");
    // Update thông tin người dùng
    user.name = userData.name;
    user.phone = userData.phone;
    user.avatar = userData.avatar;
    await user.save();
    return { message: "Personal profile updated successfully" };
  } catch (error) {
    throw new Error(error.message);
  }
};

export { changePassword, viewPersonalProfile, updatePersonalProfile };