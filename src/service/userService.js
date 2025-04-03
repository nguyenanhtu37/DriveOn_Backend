import bcrypt from 'bcrypt';
import User from '../models/user.js';
// import Role from "../models/role.js";
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

// const getUsersByRoles = async (roleNames) => {
//   try {
//     // Lấy ObjectId của các vai trò
//     const roles = await Role.find({ roleName: { $in: roleNames } }).select("_id");
//     const roleIds = roles.map(role => role._id);

//     // Tìm các user có vai trò nằm trong danh sách roleIds
//     const users = await User.find({ roles: { $in: roleIds } })
//       .populate("roles", "roleName") // Lấy thông tin roleName
//       .select("name email phone roles status createdAt updatedAt"); // Chỉ lấy các trường cần thiết
//     return users;
//   } catch (error) {
//     throw new Error(error.message);
//   }
// };

// const getUsersByRoles = async (roleNames) => {
//   try {
//     console.log("Roles received:", roleNames); // Log danh sách vai trò nhận được

//     // Lấy ObjectId của các vai trò
//     const roles = await Role.find({ roleName: { $in: roleNames } }).select("_id");
//     console.log("Role IDs found:", roles); // Log danh sách ObjectId của vai trò

//     const roleIds = roles.map(role => role._id);

//     // Tìm các user có vai trò nằm trong danh sách roleIds
//     const users = await User.find({ roles: { $in: roleIds } })
//       .populate("roles", "roleName") // Lấy thông tin roleName
//       .select("name email phone roles status createdAt updatedAt"); // Chỉ lấy các trường cần thiết

//     console.log("Users found:", users); // Log danh sách user tìm thấy
//     return users;
//   } catch (error) {
//     console.error("Error in getUsersByRoles:", error.message);
//     throw new Error(error.message);
//   }
// };

export { changePassword, viewPersonalProfile, updatePersonalProfile };