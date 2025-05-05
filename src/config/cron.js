import cron from "node-cron";
import Garage from "../models/garage.js";
import transporter from "./mailer.js";

const downgradeExpiredGarages = async () => {
  try {
    const nowUtc = new Date();
    console.log("Running cron job to downgrade expired garages at:", nowUtc.toISOString());

    const expiredGarages = await Garage.find({
      expiredTime: { $lt: nowUtc },
      tag: "pro",
    }).populate({
      path: "user",
      populate: {
        path: "roles",
        model: "Role",
      },
    });

    if (expiredGarages.length === 0) {
      console.log("No expired garages found.");
      return;
    }

    for (const garage of expiredGarages) {
      try {
        console.log(`Downgrading garage ${garage._id} (expired at ${garage.expiredTime?.toISOString()})`);
        garage.tag = "normal";
        garage.expiredTime = undefined;
        await garage.save();
        console.log(`Garage ${garage._id} downgraded to 'normal'`);

        if (!garage.user || garage.user.length === 0) {
          console.warn(`Garage ${garage._id} has no associated users, skipping...`);
          continue;
        }

        const manager = garage.user.find((u) =>
          u.roles.some((role) => role.roleName === "manager")
        );

        if (!manager || !manager.email) {
          console.warn(`Garage ${garage._id} has no manager with email, skipping...`);
          continue;
        }

        const subject = "Your Garage Subscription Has Been Downgraded";
        const text = `
<html>
  <body style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 20px; margin: 0;">
    <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);">
      <div style="background-color: #d9534f; color: white; padding: 20px; text-align: center;">
        <h1 style="margin: 0; font-size: 24px;">DriveOn</h1>
        <p style="margin: 0; font-size: 16px;">Garage Downgrade Notification</p>
      </div>
      <div style="padding: 20px;">
        <p style="font-size: 16px; color: #333333;">
          <strong>Dear ${manager.name},</strong>
        </p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">
          We regret to inform you that the subscription for your garage <strong>"${garage.name}"</strong> has been downgraded to the <strong>Normal</strong> plan due to the expiration of your premium subscription.
        </p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">
          If you wish to continue enjoying premium features, you can renew your subscription at any time.
        </p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="https://drive-on-frontend.vercel.app/" style="display: inline-block; padding: 12px 25px; background-color: #d9534f; color: white; text-decoration: none; font-size: 16px; border-radius: 5px; transition: background-color 0.3s;">
            Renew Subscription
          </a>
        </div>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">
          If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:driveonvietnam@gmail.com" style="color: #d9534f;">driveonvietnam@gmail.com</a>.
        </p>
        <p style="font-size: 16px; color: #555555; line-height: 1.6;">
          Thank you for being a part of DriveOn. We value your business.
        </p>
      </div>
      <div style="background-color: #f4f4f4; color: #777777; padding: 20px; text-align: center; font-size: 14px;">
        <p style="margin: 0;">Best regards,</p>
        <p style="margin: 0;"><strong>DriveOn Team</strong></p>
        <p style="margin: 0; font-size: 12px;">© 2025 DriveOn. All rights reserved.</p>
      </div>
    </div>
  </body>
</html>
`;

        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: manager.email,
          subject,
          html: text,
        });

        console.log(`Notification email sent to ${manager.email} for garage downgrade ${garage._id}`);
      } catch (error) {
        console.error(`Failed to downgrade and notify garage ${garage._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in cron job:", error);
  }
};

cron.schedule("00 8 * * *", downgradeExpiredGarages, { // bao cao 15:00, co nen setup tgian quet 16h?
  timezone: "Asia/Ho_Chi_Minh",
});

export const notifyExpiringGarages = async () => {
  try {
    const nowUtc = new Date();
    const threeDaysLater = new Date(nowUtc);
    threeDaysLater.setDate(nowUtc.getDate() + 3);

    console.log("Running cron job to notify expiring garages at:", nowUtc.toISOString());

    const expiringGarages = await Garage.find({
      expiredTime: { $gte: nowUtc, $lt: threeDaysLater },
      tag: "pro",
    }).populate({
      path: "user",
      populate: {
        path: "roles",
        model: "Role",
      },
    });

    if (expiringGarages.length === 0) {
      console.log("No garages expiring in the next 3 days.");
      return;
    }

    for (const garage of expiringGarages) {
      try {
        const manager = garage.user.find((u) =>
          u.roles.some((role) => role.roleName === "manager")
        );

        if (!manager || !manager.email) {
          console.warn(`Garage ${garage._id} has no manager with email, skipping...`);
          continue;
        }

        const expireTimeVN = new Date(garage.expiredTime).toLocaleString("en-US", {
          timeZone: "Asia/Ho_Chi_Minh",
        });

        const subject = "Your Garage Subscription is Expiring Soon";
        const text = `
        <html>
          <body style="font-family: Arial, sans-serif; background-color: #f4f4f9; padding: 30px;">
            <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; padding: 20px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <h2 style="text-align: center; color: #333333;">DriveOn - Subscription Expiry Alert</h2>
              <p style="font-size: 16px; color: #555555;">
                <strong>Dear ${manager.name},</strong>
              </p>
              <p style="font-size: 16px; color: #555555;">
                This is a reminder that the subscription for your garage <strong>"${garage.name}"</strong> is set to expire on <strong>${expireTimeVN}</strong>.
              </p>
              <p style="font-size: 16px; color: #555555;">
                Please renew your subscription as soon as possible to continue using all premium features.
              </p>
              <div style="text-align: center; margin: 20px 0;">
                <a href="https://drive-on-frontend.vercel.app/" style="padding: 12px 25px; background-color: #d9534f; color: white; text-decoration: none; font-size: 18px; border-radius: 5px; transition: background-color 0.3s;">
                  Renew Subscription
                </a>
              </div>
              <p style="font-size: 16px; color: #555555;">
                If you have any questions or need assistance, feel free to reach out to us at <a href="mailto:driveonvietnam@gmail.com" style="color: #d9534f;">driveonvietnam@gmail.com</a>.
              </p>
              <p style="font-size: 16px; color: #555555;">
                Thank you for choosing DriveOn. We value your business.
              </p>
              <div style="margin-top: 40px; text-align: center; font-size: 14px; color: #aaaaaa;">
                <p>Best regards,</p>
                <p><strong>DriveOn Team</strong></p>
                <p style="font-size: 12px;">© 2025 DriveOn. All rights reserved.</p>
              </div>
            </div>
          </body>
        </html>
        `;

        await transporter.sendMail({
          from: process.env.MAIL_USER,
          to: manager.email,
          subject,
          html: text,
        });

        console.log(`Notification email sent to ${manager.email} for garage ${garage._id}`);
      } catch (error) {
        console.error(`Failed to send email for garage ${garage._id}:`, error);
      }
    }
  } catch (error) {
    console.error("Error in notification cron job:", error);
  }
};

cron.schedule("07 3 * * *", notifyExpiringGarages, {
  timezone: "Asia/Ho_Chi_Minh",
});

export default downgradeExpiredGarages;