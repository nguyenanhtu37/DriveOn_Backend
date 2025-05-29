import { OAuth2Client } from "google-auth-library";

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const validateLogin = (email, password) => {
  const errors = [];
  // Email validation
  if (!email) {
    errors.push("Email không được để trống");
  } else if (typeof email !== "string") {
    errors.push("Email phải là chuỗi ký tự");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      errors.push("Email không đúng định dạng");
    }
  }
  // Password validation (login = email + password)
  if (!email?.includes("@gmail.com")) {
    if (!password) {
      errors.push("Mật khẩu không được để trống");
    } else if (typeof password !== "string") {
      errors.push("Mật khẩu phải là chuỗi ký tự");
    } else if (password.length < 6 || password.length > 50) {
      errors.push("Mật khẩu phải từ 6-50 ký tự");
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
};

export const validateResetPassword = (token, newPassword) => {
  const errors = [];
  // Validate token
  if (!token) {
    errors.push("Token không được để trống");
  }
  // Validate new password
  if (!newPassword) {
    errors.push("Mật khẩu mới không được để trống");
  } else if (typeof newPassword !== "string") {
    errors.push("Mật khẩu phải là chuỗi ký tự");
  } else {
    // Check độ dài
    if (newPassword.length < 6 || newPassword.length > 50) {
      errors.push("Mật khẩu phải từ 6-50 ký tự");
    }
    // Check độ phức tạp
    // const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{6,}$/;
    // if (!passwordRegex.test(newPassword)) {
    //   errors.push("Mật khẩu phải chứa ít nhất 1 chữ hoa, 1 chữ thường và 1 số");
    // }
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
};

export const validateSignup = (userData) => {
  const errors = [];
  // Validate email
  if (!userData.email) {
    errors.push("Email không được để trống");
  } else if (typeof userData.email !== "string") {
    errors.push("Email phải là chuỗi ký tự");
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      errors.push("Email không đúng định dạng");
    }
  }
  // Validate password
  if (!userData.password) {
    errors.push("Mật khẩu không được để trống");
  } else if (typeof userData.password !== "string") {
    errors.push("Mật khẩu phải là chuỗi ký tự");
  } else if (userData.password.length < 6) {
    errors.push("Mật khẩu phải có ít nhất 6 ký tự");
  }
  // Validate name
  if (!userData.name) {
    errors.push("Tên không được để trống");
  } else if (typeof userData.name !== "string") {
    errors.push("Tên phải là chuỗi ký tự");
  } else if (userData.name.trim().length < 2) {
    errors.push("Tên phải có ít nhất 2 ký tự");
  }
  // Validate phone (nếu có)
  if (userData.phone) {
    const phoneRegex = /(84|0[3|5|7|8|9])+([0-9]{8})\b/;
    if (!phoneRegex.test(userData.phone)) {
      errors.push("Số điện thoại không hợp lệ");
    }
  }
  // Validate bankAccount (nếu có)
  if (userData.bankAccount) {
    if (typeof userData.bankAccount !== "string") {
      errors.push("Số tài khoản phải là chuỗi số");
    } else if (!/^\d+$/.test(userData.bankAccount)) {
      errors.push("Số tài khoản chỉ được chứa số");
    }
  }
  // Validate bankName (nếu có)
  if (userData.bankName) {
    if (typeof userData.bankName !== "string") {
      errors.push("Tên ngân hàng phải là chuỗi ký tự");
    } else if (userData.bankName.trim().length < 2) {
      errors.push("Tên ngân hàng không hợp lệ");
    }
  }
  if (errors.length > 0) {
    throw new Error(errors.join(", "));
  }
};
