import admin from '../config/firebase.js';

export const sendMultipleNotifications = async (deviceTokens, title, body) => {
  if (!Array.isArray(deviceTokens) || deviceTokens.length === 0) {
    console.error("[sendMultipleNotifications] deviceTokens invalid:", deviceTokens);
    throw new Error("deviceTokens must be a non-empty array");
  }

  // Loại bỏ token trùng
  const uniqueTokens = [...new Set(deviceTokens)];

  const messages = uniqueTokens.map(token => ({
    notification: { title, body },
    token,
    android: { priority: "high" },
    apns: { headers: { "apns-priority": "10" } },
    webpush: { headers: { Urgency: "high" } },
  }));

  console.log("[sendMultipleNotifications] Prepared messages:", JSON.stringify(messages, null, 2));

  try {
    const response = await admin.messaging().sendEach(messages);

    console.log("[sendMultipleNotifications] sendEach response:", JSON.stringify(response, null, 2));

    const failedTokens = [];
    response.responses.forEach((resp, idx) => {
      if (!resp.success) {
        console.error(`[sendMultipleNotifications] Failed to send to token: ${uniqueTokens[idx]}, error:`, resp.error);
        failedTokens.push(uniqueTokens[idx]);
      }
    });

    console.log(`[sendMultipleNotifications] Summary: successCount=${response.successCount}, failureCount=${response.failureCount}`);

    return {
      successCount: response.successCount,
      failureCount: response.failureCount,
      failedTokens
    };
  } catch (error) {
    console.error("[sendMultipleNotifications] Caught unexpected error:", error);
    throw error;
  }
};