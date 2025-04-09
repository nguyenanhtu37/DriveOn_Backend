import crypto from 'crypto';

/**
 * Xác minh chữ ký từ webhook PayOS
 * @param {object} data - Object `data` trong webhook
 * @param {string} secretKey - PAYOS_CLIENT_SECRET từ môi trường
 * @param {string} receivedSignature - Signature từ webhook gửi đến
 * @returns {boolean} true nếu hợp lệ, false nếu không
 */
export const isValidSignature = (data, secretKey, receivedSignature) => {
  // Sắp xếp key theo thứ tự a-z
  const sortedKeys = Object.keys(data).sort();

  // Ghép từng phần tử thành key=value nối nhau bởi &
  const rawData = sortedKeys.map(key => `${key}=${data[key]}`).join('&');

  // Tạo signature dùng secret key
  const hmac = crypto.createHmac('sha256', secretKey);
  const expectedSignature = hmac.update(rawData).digest('hex');

  // So sánh với signature nhận được
  return expectedSignature === receivedSignature;
};
