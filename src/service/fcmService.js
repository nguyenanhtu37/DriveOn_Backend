import admin from '../config/firebase.js';

export const sendMultipleNotifications = async (deviceTokens, title, body) => {
    if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
        throw new Error("deviceTokens must be a non-empty array");
    }

    const messages = deviceTokens.map(token => ({
        notification: {
            title,
            body,
        },
        token: token
    }));

    try {
        const response = await admin.messaging().sendEach(messages);

        const failedTokens = [];
        response.responses.forEach((resp, idx) => {
            if (!resp.success) {
                failedTokens.push(deviceTokens[idx]);
            }
        });

        return {
            successCount: response.successCount,
            failureCount: response.failureCount,
            failedTokens
        };
    } catch (error) {
        throw error;
    };
}