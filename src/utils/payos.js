import crypto from 'crypto';

/**
 * Verify PayOS signature - fix chuẩn theo định dạng thực tế PayOS gửi về.
 */
export function isValidSignature(data, key, signature) {
    const sortedKeys = Object.keys(data).sort();

    const rawData = sortedKeys.map(k => {
        let value = data[k];

        if (value === undefined || value === null) {
            value = 'null'; // PayOS dùng string "null"
        } else {
            value = String(value).trim(); // remove leading/trailing whitespace
        }

        return `${k}=${value}`;
    }).join('&');

    console.log("🔑 Sorted keys:", sortedKeys);
    console.log("🧾 Raw data string for HMAC:", rawData);

    const expectedSignature = crypto
        .createHmac('sha256', key)
        .update(rawData)
        .digest('hex');

    console.log("🔐 Expected signature:", expectedSignature);
    console.log("🧾 Received signature:", signature);

    return expectedSignature === signature;
}

// import crypto from 'crypto';
// import dotenv from 'dotenv';

// dotenv.config();

// const key = 087f3d73f8b52604611f662be7fdf7c5e4121434109b9e86be3c686cd7ed83f6; 
// const data = {
//   accountNumber: '5311329151',
//   amount: 100000,
//   description: 'MOCK123456 Upgrade Garage DriveOn 1m',
//   reference: 'mock-ref-uuid-123456',
//   transactionDateTime: '2025-04-09 20:00:00',
//   virtualAccountNumber: 'V3CAS5311329151',
//   counterAccountBankId: '',
//   counterAccountBankName: '',
//   counterAccountName: null,
//   counterAccountNumber: null,
//   virtualAccountName: '',
//   currency: 'VND',
//   orderCode: 999999,
//   paymentLinkId: 'mock-payment-link-id-123',
//   code: '00',
//   desc: 'success'
// };

// const sortedKeys = Object.keys(data).sort();
// const raw = sortedKeys
//   .map(k => `${k}=${data[k] === null ? 'null' : String(data[k]).trim()}`)
//   .join('&');

// const signature = crypto
//   .createHmac('sha256', key)
//   .update(raw)
//   .digest('hex');

// console.log("🧾 Signature:", signature);

