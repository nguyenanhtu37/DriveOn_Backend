// import crypto from 'crypto';
// export const isValidSignature = (data, secretKey, receivedSignature) => {
//   const sortedKeys = Object.keys(data).sort();
//   const rawData = sortedKeys.map(key => `${key}=${data[key]}`).join('&');

//   const hmac = crypto.createHmac('sha256', secretKey);
//   const expectedSignature = hmac.update(rawData).digest('hex');

//   return expectedSignature === receivedSignature;
// };
