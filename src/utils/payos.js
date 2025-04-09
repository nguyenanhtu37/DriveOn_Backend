import crypto from 'crypto';

/**
 * Verify PayOS signature.
 * @param {Object} data - The data object inside webhook.
 * @param {string} key - PAYOS_CHECKSUM_KEY (not API key!)
 * @param {string} signature - Received signature from webhook
 * @returns {boolean}
 */
export function isValidSignature(data, key, signature) {
    const sortedKeys = Object.keys(data).sort();

    // Chuẩn hóa key và value, loại bỏ ký tự vô hình
    const rawData = sortedKeys.map(k => {
        const cleanKey = k.replace(/\s+/g, ''); // xóa white space
        const value = String(data[k]).replace(/\s+/g, ' '); // normalize space
        return `${cleanKey}=${value}`;
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
