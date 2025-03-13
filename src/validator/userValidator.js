import mongoose from 'mongoose';

export const validateUserData = (userData) => {
  if (!userData) {
    throw new Error("Không tìm thấy thông tin người dùng");
  }
  return userData;
};

export const validateUpdateProfile = (userData) => {
  const errors = [];
  // Validate name
  if (userData.name !== undefined) {
    if (typeof userData.name !== 'string') {
      errors.push("Tên phải là chuỗi ký tự");
    } else if (userData.name.trim().length < 2) {
      errors.push("Tên phải có ít nhất 2 ký tự");
    }
  }
  // Validate phone
  if (userData.phone !== undefined) {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(userData.phone)) {
      errors.push("Số điện thoại không hợp lệ");
    }
  }
  // Validate avatar URL
  if (userData.avatar !== undefined) {
    const urlRegex = /^(https?:\/\/)?([\da-z.-]+)\.([a-z.]{2,6})([/\w .-]*)*\/?$/;
    if (!urlRegex.test(userData.avatar)) {
      errors.push("URL avatar không hợp lệ");
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
  return true;
};

export const validateChangePassword = (oldPassword, newPassword) => {
  const errors = [];
  // Validate mat khau cu
  if (!oldPassword) {
    errors.push("Mật khẩu cũ không được để trống");
  } else if (typeof oldPassword !== 'string') {
    errors.push("Mật khẩu cũ phải là chuỗi ký tự");
  }
  // Validate mat khau moi
  if (!newPassword) {
    errors.push("Mật khẩu mới không được để trống");
  } else if (typeof newPassword !== 'string') {
    errors.push("Mật khẩu mới phải là chuỗi ký tự");
  } else if (newPassword.length < 6 || newPassword.length > 50) {
    errors.push("Mật khẩu mới phải từ 6-50 ký tự");
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
  return true;
};
