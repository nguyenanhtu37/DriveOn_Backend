import * as fcmService from "../service/fcmService.js";

export const sendMutipleFirebaseNotifications = async (req, res) => {
  try {
    const { title, body, deviceTokens } = req.body;
    const response = await fcmService.sendMultipleNotifications(
      deviceTokens,
      title,
      body
    );
    res.status(200).json({
      message: "Notification sent successfully",
      success: true,
      response,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error sending notification",
      success: false,
      error: error.message,
    });
  }
};
