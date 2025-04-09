import crypto from 'crypto';

/**
 * Generate raw data string used for HMAC signature.
 * Ensure all fields (even null) are included in the correct order.
 */
export function isValidSignature(data, key, signature) {
    // Danh sách keys đúng theo định dạng PayOS yêu cầu (không được thiếu key nào)
    const expectedKeys = [
        'accountNumber',
        'amount',
        'code',
        'counterAccountBankId',
        'counterAccountBankName',
        'counterAccountName',
        'counterAccountNumber',
        'currency',
        'desc',
        'description',
        'orderCode',
        'paymentLinkId',
        'reference',
        'transactionDateTime',
        'virtualAccountName',
        'virtualAccountNumber'
    ];

    const rawData = expectedKeys.map(k => {
        let value = data[k];

        // Convert undefined to 'null', trim nếu là string
        if (value === undefined || value === null) {
            value = 'null';
        } else {
            value = String(value).replace(/\s+/g, ' ').trim(); // normalize space
        }

        return `${k}=${value}`;
    }).join('&');

    console.log("🧾 Raw data string for HMAC:", rawData);

    const expectedSignature = crypto
        .createHmac('sha256', key)
        .update(rawData)
        .digest('hex');

    console.log("🔐 Expected signature:", expectedSignature);
    console.log("🧾 Received signature:", signature);

    return expectedSignature === signature;
}
