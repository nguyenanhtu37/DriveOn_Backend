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
