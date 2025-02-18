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
  // Validate bankAccount
  if (userData.bankAccount !== undefined) {
    if (typeof userData.bankAccount !== 'string') {
      errors.push("Số tài khoản phải là chuỗi số");
    } else if (!/^\d+$/.test(userData.bankAccount)) {
      errors.push("Số tài khoản chỉ được chứa số");
    }
  }
  // Validate bankName
  if (userData.bankName !== undefined) {
    if (typeof userData.bankName !== 'string') {
      errors.push("Tên ngân hàng phải là chuỗi ký tự");
    } else if (userData.bankName.trim().length < 2) {
      errors.push("Tên ngân hàng không hợp lệ");
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

