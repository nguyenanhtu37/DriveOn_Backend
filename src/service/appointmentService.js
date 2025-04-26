import Appointment from "../models/appointment.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import {
  updateAppointmentValidate,
  createAppointmentValidate,
} from "../validator/appointmentValidator.js";
import transporter from "../config/mailer.js";
import Vehicle from "../models/vehicle.js";
import ServiceDetail from "../models/serviceDetail.js";
import Role from "../models/role.js";
import mongoose from "mongoose";

const checkBooking = async (
  vehicleId,
  garageId,
  start,
  end,
  currentAppointmentId = null,
  isSplit = false
) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    return {
      hasConflict: true,
      conflictMessage: "Garage not found",
    };
  }

  // Using getUTCDay for day of week calculations in UTC
  const daysOfWeek = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const appointmentDay = daysOfWeek[start.getUTCDay()];

  // Check if garage operates on start day
  if (!garage.operating_days.includes(appointmentDay)) {
    return {
      hasConflict: true,
      conflictMessage: `Garage is closed on ${appointmentDay}s`,
    };
  }

  // Get opening hours for the start day
  const [garageOpenHour, garageOpenMinute] = garage.openTime
    .split(":")
    .map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime
    .split(":")
    .map(Number);

  // Convert local Vietnam time (UTC+7) to UTC by subtracting 7 hours
  const utcOpenHour = garageOpenHour - 7;
  const utcOpenMinute = garageOpenMinute;
  const utcCloseHour = garageCloseHour - 7;
  const utcCloseMinute = garageCloseMinute;

  // Handle day wraparound if UTC hour becomes negative
  let openDayOffset = 0;
  let utcAdjustedOpenHour = utcOpenHour;

  if (utcAdjustedOpenHour < 0) {
    utcAdjustedOpenHour += 24;
    openDayOffset = -1; // Previous day in UTC
  }

  // Create time for garage opening on appointment day using setUTCHours
  const garageOpenTime = new Date(start);
  garageOpenTime.setUTCDate(garageOpenTime.getUTCDate() + openDayOffset);
  garageOpenTime.setUTCHours(utcAdjustedOpenHour, utcOpenMinute, 0, 0);

  // Check if appointment starts before opening time
  if (start < garageOpenTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`,
    };
  }

  // Handle close time wraparound
  let closeDayOffset = 0;
  let utcAdjustedCloseHour = utcCloseHour;

  if (utcAdjustedCloseHour < 0) {
    utcAdjustedCloseHour += 24;
    closeDayOffset = -1; // Previous day in UTC
  }

  // Create time for garage closing on appointment day
  const garageCloseTime = new Date(start);
  garageCloseTime.setUTCDate(garageCloseTime.getUTCDate() + closeDayOffset);
  garageCloseTime.setUTCHours(utcAdjustedCloseHour, utcCloseMinute, 0, 0);

  // Check if appointment starts after closing time
  if (start > garageCloseTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage closes at ${garage.closeTime}`,
    };
  }

  const overlappingAppointments = await Appointment.find({
    vehicle: vehicleId,
    garage: { $ne: garageId }, //  chỉ check conflict ở garage khác
    _id: { $ne: currentAppointmentId },
    $or: [
      { start: { $lte: start }, end: { $gt: start } },
      { start: { $lt: end }, end: { $gte: end } },
      { start: { $gte: start }, end: { $lte: end } },
    ],
    status: { $nin: ["Cancelled", "Rejected"] },
  });


  if (overlappingAppointments.length > 0) {
    const conflictGarage = await Garage.findById(
      overlappingAppointments[0].garage
    );
    const garageName = conflictGarage ? conflictGarage.name : "another garage";

    return {
      hasConflict: true,
      conflictMessage: `Vehicle is already scheduled at ${garageName} during this time`,
    };
  }

  return { hasConflict: false };
};

const convertAndValidateDateTime = async (start, serviceIds) => {
  try {
    const daysOfWeek = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const startTime = typeof start === "string" ? new Date(start) : start;

    if (isNaN(startTime.getTime())) {
      throw new Error(
        "Invalid date format. Please provide a valid date and time."
      );
    }

    const nowUtc = new Date();
    if (startTime <= nowUtc) {
      throw new Error("Appointment time must be in the future");
    }

    const dayOfWeek = daysOfWeek[startTime.getUTCDay()];

    // Get garage details from first service
    const firstService = await ServiceDetail.findById(serviceIds[0]);
    if (!firstService) {
      throw new Error("Service not found");
    }

    const garage = await Garage.findById(firstService.garage);
    if (!garage) {
      throw new Error("Garage not found");
    }

    // Check if garage operates on the appointment day
    if (!garage.operating_days.includes(dayOfWeek)) {
      throw new Error(`Garage is closed on ${dayOfWeek}s`);
    }

    // Calculate total service duration
    let totalDurationMinutes = 0;
    for (const serviceId of serviceIds) {
      const serviceDetail = await ServiceDetail.findById(serviceId);
      if (!serviceDetail) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }
      totalDurationMinutes += serviceDetail.duration || 60;
    }

    // Parse garage operating hours (Vietnam time)
    const [openHour, openMinute] = garage.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = garage.closeTime.split(":").map(Number);

    // Convert local Vietnam time (UTC+7) to UTC
    const utcOpenHour = openHour - 7;
    const utcOpenMinute = openMinute;
    const utcCloseHour = closeHour - 7;
    const utcCloseMinute = closeMinute;

    // Handle day wraparound for opening time
    let openDayOffset = 0;
    let utcAdjustedOpenHour = utcOpenHour;
    if (utcAdjustedOpenHour < 0) {
      utcAdjustedOpenHour += 24;
      openDayOffset = -1;
    }

    // Handle day wraparound for closing time
    let closeDayOffset = 0;
    let utcAdjustedCloseHour = utcCloseHour;
    if (utcAdjustedCloseHour < 0) {
      utcAdjustedCloseHour += 24;
      closeDayOffset = -1;
    }

    // Create garage open and close times for the appointment day
    const garageOpenTime = new Date(startTime);
    garageOpenTime.setUTCDate(garageOpenTime.getUTCDate() + openDayOffset);
    garageOpenTime.setUTCHours(utcAdjustedOpenHour, utcOpenMinute, 0, 0);

    const garageCloseTime = new Date(startTime);
    garageCloseTime.setUTCDate(garageCloseTime.getUTCDate() + closeDayOffset);
    garageCloseTime.setUTCHours(utcAdjustedCloseHour, utcCloseMinute, 0, 0);

    // 1. Check if start time is within operating hours
    if (startTime < garageOpenTime) {
      throw new Error(
        `Appointment cannot start before opening time (${garage.openTime})`
      );
    }

    if (startTime > garageCloseTime) {
      throw new Error(
        `Appointment cannot start after closing time (${garage.closeTime})`
      );
    }

    // 2. Calculate initial end time based on duration
    let endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);

    // 3. If end time exceeds closing time, handle split appointment
    if (endTime > garageCloseTime) {
      // Minutes that can be completed on day 1
      const minutesBeforeClosing = Math.floor(
        (garageCloseTime - startTime) / 60000
      );

      // Remaining minutes to be scheduled on next operating day
      const remainingMinutes = totalDurationMinutes - minutesBeforeClosing;

      // Find the next operating day
      let nextDayIndex = (startTime.getUTCDay() + 1) % 7;
      let daysToAdd = 1;

      while (!garage.operating_days.includes(daysOfWeek[nextDayIndex])) {
        nextDayIndex = (nextDayIndex + 1) % 7;
        daysToAdd++;
      }

      // Get the next operating day's opening time
      const nextDayOpenTime = new Date(startTime);
      nextDayOpenTime.setUTCDate(nextDayOpenTime.getUTCDate() + daysToAdd);
      nextDayOpenTime.setUTCHours(utcAdjustedOpenHour, utcOpenMinute, 0, 0);

      // Calculate new end time: next day open time + remaining minutes
      endTime = new Date(nextDayOpenTime.getTime() + remainingMinutes * 60000);

      // Format display info for continuation details
      const nextDayDisplay = nextDayOpenTime.toLocaleDateString("vi-VN", {
        timeZone: "Asia/Ho_Chi_Minh",
      });
      const nextDayName = daysOfWeek[nextDayIndex];

      return {
        isValid: true,
        startTime,
        endTime,
        isSplit: true,
        continuationDay: {
          date: nextDayOpenTime,
          displayDate: nextDayDisplay,
          dayName: nextDayName,
          durationMinutes: remainingMinutes,
        },
        note: `Service will continue on ${nextDayName}, ${nextDayDisplay} for ${remainingMinutes} minutes.`,
      };
    }

    // Return standard appointment if it fits within operating hours
    return {
      isValid: true,
      startTime,
      endTime,
      isSplit: false,
    };
  } catch (error) {
    return {
      startTime: null,
      endTime: null,
      isValid: false,
      error: error.message,
    };
  }
};

export const createAppointmentService = async ({
  userId,
  garage,
  service,
  vehicle,
  start,
  tag,
  note,
}) => {
  // Validation and conflict checking code remains the same
  const validation = createAppointmentValidate({
    garage,
    service,
    vehicle,
    start,
    tag,
    note,
  });
  if (!validation.valid) {
    throw new Error(`Validation error: ${JSON.stringify(validation.errors)}`);
  }

  const startTime = typeof start === "string" ? new Date(start) : start;
  const validationResult = await convertAndValidateDateTime(startTime, service);

  if (!validationResult.isValid) {
    throw new Error(validationResult.error);
  }

  const { startTime: validatedStartTime, endTime, isSplit } = validationResult;

  const firstService = await ServiceDetail.findById(service[0]);
  if (!firstService) {
    throw new Error("Service not found");
  }

  const bookingCheck = await checkBooking(
    vehicle,
    garage,
    validatedStartTime,
    endTime,
    null,
    isSplit // Pass the isSplit flag to checkBooking
  );

  if (bookingCheck && bookingCheck.hasConflict) {
    throw new Error(
      bookingCheck.conflictMessage || "Booking conflict detected"
    );
  }

  // Create and save the appointment
  const newAppointment = new Appointment({
    user: userId,
    garage,
    service,
    vehicle,
    start: validatedStartTime,
    end: endTime,
    status: "Pending",
    tag,
    note,
  });

  await newAppointment.save();

  // Send emails asynchronously - fire and forget
  sendAppointmentEmails(
    newAppointment._id,
    userId,
    garage,
    vehicle,
    note,
    validatedStartTime,
    endTime
  ).catch((error) => console.error("Error sending appointment emails:", error));

  // Return immediately after saving the appointment
  return newAppointment;
};

// Separate function to handle email sending in the background
async function sendAppointmentEmails(
  appointmentId,
  userId,
  garageId,
  vehicleId,
  note,
  start,
  end
) {
  try {
    // Retrieve information for email
    const user = await User.findById(userId);
    const garageInfo = await Garage.findById(garageId).select("name address");
    const vehicleInfo = await Vehicle.findById(vehicleId).select(
      "carName carPlate"
    );

    // Format dates for email with Asia/Ho_Chi_Minh timezone
    const displayDate = start.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Send confirmation email to customer
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Xác nhận đặt lịch hẹn",
      html: `
        <h2>Xin chào ${user.name},</h2>
        <p>Bạn đã đặt lịch hẹn thành công tại hệ thống của chúng tôi.</p>
        <h3>Chi tiết lịch hẹn:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Xe:</strong> ${vehicleInfo.carName} (${
        vehicleInfo.carPlate
      })</li>
          <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
          <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Ghi chú:</strong> ${note || "Không có"}</li>
          <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
        </ul>
        <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
        <p>Xem chi tiết lịch hẹn của bạn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    });

    // Get garage managers to notify them
    const roleManager = await Role.findOne({ roleName: "manager" });
    if (roleManager) {
      const garageManagers = await User.find({
        garageList: garageId,
        roles: roleManager._id,
      });

      if (garageManagers && garageManagers.length > 0) {
        for (const manager of garageManagers) {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: manager.email,
            subject: "Thông báo lịch hẹn mới",
            html: `
              <h2>Xin chào ${manager.name},</h2>
              <p>Có một lịch hẹn mới được đặt tại garage của bạn.</p>
              <h3>Chi tiết lịch hẹn:</h3>
              <ul>
                <li><strong>Khách hàng:</strong> ${user.name}</li>
                <li><strong>Số điện thoại:</strong> ${user.phone}</li>
                <li><strong>Email:</strong> ${user.email}</li>
                <li><strong>Xe:</strong> ${vehicleInfo.carName} (${
              vehicleInfo.carPlate
            })</li>
                <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
                <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
                <li><strong>Ghi chú:</strong> ${note || "Không có"}</li>
              </ul>
              <p>Vui lòng đăng nhập vào hệ thống để xác nhận hoặc từ chối lịch hẹn này.</p>
              <p>Xem chi tiết lịch hẹn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
            `,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in email sending process:", error);
  }
}

export const getAppointmentsByUserService = async (userId) => {
  return await Appointment.find({ user: userId })
    .populate("user", "name email")
    .populate("garage", "name address")
    .populate("vehicle", "carBrand carName carPlate")
    .populate("service", "");
};

export const getAppointmentByIdService = async (appointmentId) => {
  return await Appointment.findById(appointmentId)
      .populate("user", "avatar name email locale phone") // Select basic user information
      .populate("garage", "name address") // Select basic garage information
      .populate({
        path: "vehicle",
        select: "carBrand carName carPlate",
        populate: {
          path: "carBrand",
          select: "brandName logo"
        }
      }) // Populate vehicle with nested carBrand
      .populate("service") // Populate service details
      .populate("assignedStaff", "name avatar"); // Add staff information
};

export const getAppointmentsByGarageService = async (garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return await Appointment.find({ garage: garageId })
    .populate("user", "name email avatar address") // Select basic user information
    .populate("garage", "name address") // Select basic garage information
    .populate("vehicle", "carBrand carName carPlate") // Select basic vehicle information
    .populate("service"); // Populate service details
};

export const confirmAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const user = await User.findById(userId);
  if (!user || !user.garageList.includes(appointment.garage.toString())) {
    throw new Error("Unauthorized");
  }

  appointment.status = "Accepted";
  await appointment.save();

  // Send confirmation email asynchronously (fire and forget)
  sendConfirmationEmail(
    appointmentId,
    appointment.user,
    appointment.garage,
    appointment.start,
    appointment.end
  ).catch((error) => console.error("Error sending confirmation email:", error));

  // Return immediately after saving
  return appointment;
};

// Separate function to handle email sending in background
async function sendConfirmationEmail(
  appointmentId,
  customerId,
  garageId,
  startTime,
  endTime
) {
  try {
    // Get user and garage info for email
    const customer = await User.findById(customerId);
    const garageInfo = await Garage.findById(garageId).select("name address");

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Send confirmation email to customer
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: customer.email,
      subject: "Lịch hẹn của bạn đã được xác nhận",
      html: `
        <h2>Xin chào ${customer.name},</h2>
        <p>Lịch hẹn của bạn đã được <span style="color: #28a745; font-weight: bold;">xác nhận</span>.</p>
        <h3>Chi tiết lịch hẹn:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
          <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Trạng thái:</strong> Đã xác nhận</li>
        </ul>
        <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>
        <p>Xem chi tiết lịch hẹn của bạn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    });
  } catch (error) {
    console.error("Error in confirmation email process:", error);
  }
}

export const denyAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const user = await User.findById(userId);
  if (!user || !user.garageList.includes(appointment.garage.toString())) {
    throw new Error("Unauthorized");
  }

  appointment.status = "Rejected";
  await appointment.save();

  // Send rejection email asynchronously
  sendRejectionEmail(
    appointmentId,
    appointment.user,
    appointment.garage,
    appointment.start,
    appointment.end
  ).catch((error) => console.error("Error sending rejection email:", error));

  // Return immediately after saving
  return appointment;
};

// Separate function to handle email sending in background
async function sendRejectionEmail(
  appointmentId,
  customerId,
  garageId,
  startTime,
  endTime
) {
  try {
    // Get user and garage info for email
    const customer = await User.findById(customerId);
    const garageInfo = await Garage.findById(garageId).select("name address");

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Send rejection email to customer
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: customer.email,
      subject: "Thông báo từ chối lịch hẹn",
      html: `
        <h2>Xin chào ${customer.name},</h2>
        <p>Chúng tôi rất tiếc phải thông báo rằng lịch hẹn của bạn đã bị <span style="color: #dc3545; font-weight: bold;">từ chối</span>.</p>
        <h3>Chi tiết lịch hẹn:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
          <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Trạng thái:</strong> Đã từ chối</li>
        </ul>
        <p>Vui lòng liên hệ với garage để biết thêm thông tin hoặc đặt lịch hẹn mới.</p>
        <p>Xem chi tiết lịch hẹn của bạn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    });
  } catch (error) {
    console.error("Error in rejection email process:", error);
  }
}

export const completeAppointmentService = async (
  appointmentId,
  userId,
  updatedEndTime = null,
  nextMaintenance = null
) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  const user = await User.findById(userId);
  if (!user || !user.garageList.includes(appointment.garage.toString())) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "Accepted") {
    throw new Error("Only accepted appointments can be completed");
  }

  // Update end time if provided
  if (updatedEndTime) {
    const endTime =
      typeof updatedEndTime === "string"
        ? new Date(updatedEndTime)
        : updatedEndTime;
    if (isNaN(endTime.getTime())) {
      throw new Error("Invalid end time format");
    }

    // Simple validation: ensure end time is after start time
    if (endTime <= appointment.start) {
      throw new Error("End time must be after start time");
    }

    appointment.end = endTime;
  }

  // Set next maintenance date if provided
  if (nextMaintenance) {
    const nextDate =
      typeof nextMaintenance === "string"
        ? new Date(nextMaintenance)
        : nextMaintenance;

    if (isNaN(nextDate.getTime())) {
      throw new Error("Invalid next maintenance date");
    }

    appointment.nextMaintenance = nextDate;
  }

  // Assign staff who completed the service
  appointment.assignedStaff = userId;
  appointment.status = "Completed";
  await appointment.save();

  // Get user and garage info for email
  const customer = await User.findById(appointment.user);
  const garageInfo = await Garage.findById(appointment.garage).select(
    "name address phone"
  );
  const staffInfo = await User.findById(userId).select("name");

  // Format dates for email display in local time (Vietnam timezone)
  const displayDate = appointment.start.toLocaleDateString("vi-VN", {
    timeZone: "Asia/Ho_Chi_Minh",
  });
  const displayStartTime = appointment.start.toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Ho_Chi_Minh",
  });

  // Send completion email to customer
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer.email,
    subject: "Dịch vụ của bạn đã hoàn thành",
    html: `
      <h2>Xin chào ${customer.name},</h2>
      <p>Dịch vụ của bạn đã được hoàn thành.</p>
      <h3>Chi tiết dịch vụ:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime}</li>
        <li><strong>Nhân viên phụ trách:</strong> ${staffInfo.name}</li>
        <li><strong>Trạng thái:</strong> Đã hoàn thành</li>
      </ul>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      <p>Xem chi tiết lịch hẹn của bạn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
    `,
  });

  return appointment;
};

export const getNextMaintenanceListService = async (
  garageId,
  page = 1,
  limit = 10,
  maxDaysLeft = null
) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    // Kiểm tra nếu garage không có tag pro
    if (garage.tag !== "pro") {
      throw new Error(
        "This feature is only available for garages with the 'pro' tag"
      );
    }

    // Tính toán skip dựa trên page và limit
    const skip = (page - 1) * limit;

    // Lấy danh sách các lịch hẹn có `nextMaintenance` và thuộc về garage
    const appointments = await Appointment.find({
      garage: garageId,
      nextMaintenance: { $exists: true, $ne: null },
    })
      .populate("vehicle", "carBrand carName carPlate")
      .populate("user", "name phone email")
      .populate("service", "name")
      .sort({ nextMaintenance: 1 }) // Sắp xếp theo ngày gần nhất
      .skip(skip)
      .limit(limit);

    // Tính số ngày còn lại cho mỗi lịch hẹn
    const today = new Date();
    let appointmentsWithDaysLeft = appointments.map((appointment) => {
      const nextMaintenanceDate = new Date(appointment.nextMaintenance);
      const timeDiff = nextMaintenanceDate - today; // Thời gian chênh lệch (ms)
      const daysLeft = Math.ceil(timeDiff / (1000 * 60 * 60 * 24)); // Chuyển đổi sang ngày

      return {
        ...appointment.toObject(),
        daysLeft: daysLeft > 0 ? daysLeft : 0, // Nếu đã qua ngày bảo dưỡng, đặt là 0
      };
    });

    // Lọc danh sách dựa trên `maxDaysLeft` nếu được cung cấp
    if (maxDaysLeft !== null) {
      appointmentsWithDaysLeft = appointmentsWithDaysLeft.filter(
        (appointment) => appointment.daysLeft <= maxDaysLeft
      );
    }

    // Tính tổng số lịch hẹn để trả về tổng số trang
    const totalAppointments = await Appointment.countDocuments({
      garage: garageId,
      nextMaintenance: { $exists: true, $ne: null },
    });
    const totalPages = Math.ceil(totalAppointments / limit);

    return {
      appointments: appointmentsWithDaysLeft,
      totalPages,
      currentPage: page,
    };
  } catch (error) {
    throw new Error(error.message);
  }
};

export const createAppointmentByStaffService = async ({
  garage,
  service,
  vehicle,
  start,
  userId,
  staffId,
}) => {
  // Chuyển đổi các trường thành ObjectId
  const garageId = new mongoose.Types.ObjectId(garage);
  const serviceIds = service.map((id) => new mongoose.Types.ObjectId(id));
  const vehicleId = new mongoose.Types.ObjectId(vehicle);
  const carOwnerId = new mongoose.Types.ObjectId(userId);

  // Kiểm tra xem staff có thuộc về garage không
  const staff = await User.findById(staffId);
  if (!staff) {
    throw new Error("Staff not found");
  }
  if (!staff.garageList.includes(garageId.toString())) {
    throw new Error(
      "Staff does not have permission to create appointments for this garage"
    );
  }

  // Kiểm tra xem userId có phải là car owner không
  const carOwner = await User.findById(carOwnerId);
  if (!carOwner) {
    throw new Error("Car owner not found");
  }

  // Kiểm tra vai trò của userId
  const carOwnerRole = await Role.findOne({ roleName: "carowner" });
  if (!carOwner.roles.includes(carOwnerRole._id)) {
    throw new Error("The provided userId does not belong to a car owner");
  }

  // Kiểm tra xem vehicleId có thuộc về userId không
  const vehicleData = await Vehicle.findById(vehicleId);
  if (!vehicleData) {
    throw new Error("Vehicle not found");
  }
  if (vehicleData.carOwner.toString() !== userId) {
    throw new Error(
      "The provided vehicle does not belong to the specified car owner"
    );
  }

  // Kiểm tra xem tất cả các serviceIds có thuộc về garageId không
  const services = await ServiceDetail.find({
    _id: { $in: serviceIds },
    garage: garageId,
  });
  if (services.length !== serviceIds.length) {
    throw new Error(
      "One or more services do not belong to the specified garage"
    );
  }

  // Validate input
  const validation = createAppointmentValidate({
    garage: garageId,
    service: serviceIds,
    vehicle: vehicleId,
    start,
  });
  if (!validation.valid) {
    throw new Error(`Validation error: ${JSON.stringify(validation.errors)}`);
  }

  const startTime = typeof start === "string" ? new Date(start) : start;

  // Validate start time and calculate end time
  const validationResult = await convertAndValidateDateTime(
    startTime,
    serviceIds
  );
  if (!validationResult.isValid) {
    throw new Error(validationResult.error);
  }

  const { startTime: validatedStartTime, endTime } = validationResult;

  // Check for booking conflicts
  const bookingCheck = await checkBooking(
    vehicleId,
    garageId,
    validatedStartTime,
    endTime
  );
  if (bookingCheck.hasConflict) {
    throw new Error(
      bookingCheck.conflictMessage || "Booking conflict detected"
    );
  }

  // Create and save the appointment
  const newAppointment = new Appointment({
    user: carOwnerId, // Lưu dưới dạng ObjectId
    garage: garageId,
    service: serviceIds,
    vehicle: vehicleId,
    start: validatedStartTime,
    end: endTime,
    status: "Accepted",
    tag: "Maintenance", // Default tag của maintenance
    note: `Created by staff ${staff.name}`,
    assignedStaff: staffId,
  });

  await newAppointment.save();

  // Gửi email thông báo cho car owner
  sendAppointmentStaffCreatedEmail(
    newAppointment,
    carOwner,
    garageId,
    staffId
  ).catch((error) =>
    console.error("Error sending appointment created email:", error)
  );

  return newAppointment;
};

async function sendAppointmentStaffCreatedEmail(
  appointment,
  carOwner,
  garageId,
  staffId
) {
  try {
    // Lấy thông tin garage và staff
    const garage = await Garage.findById(garageId).select("name address");
    const staff = await User.findById(staffId).select("name");

    // Format ngày và giờ
    const displayDate = appointment.start.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = appointment.start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = appointment.end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Nội dung email
    const emailContent = `
      <h2>Xin chào ${carOwner.name},</h2>
      <p>Lịch hẹn bảo dưỡng tiếp theo của bạn đã được tạo thành công bởi nhân viên <strong>${staff.name}</strong>.</p>
      <h3>Chi tiết lịch hẹn:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garage.name}</li>
        <li><strong>Địa chỉ:</strong> ${garage.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
      </ul>
      <p>Vui lòng đến đúng giờ để được phục vụ tốt nhất.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `;

    // Gửi email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: carOwner.email,
      subject:
        "Xác nhận lịch hẹn bảo dưỡng - Được tạo bởi nhân viên của chúng tôi",
      html: emailContent,
    });

    console.log(`Appointment created email sent to ${carOwner.email}`);
  } catch (error) {
    console.error("Error sending appointment created email:", error.message);
  }
}

export const sendMaintenanceReminderEmails = async () => {
  try {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);

    // Tìm các lịch bảo dưỡng có `nextMaintenance` đúng 7 ngày sau
    const appointments = await Appointment.find({
      nextMaintenance: {
        $gte: sevenDaysLater.setHours(0, 0, 0, 0), // Bắt đầu ngày
        $lte: sevenDaysLater.setHours(23, 59, 59, 999), // Kết thúc ngày
      },
    })
      .populate("user", "name email")
      .populate("vehicle", "carName carPlate")
      .populate("garage", "name");

    // Gửi email cho từng chủ xe
    for (const appointment of appointments) {
      const { user, vehicle, garage, nextMaintenance } = appointment;

      if (user && user.email) {
        const formattedDate = nextMaintenance.toLocaleDateString("vi-VN", {
          timeZone: "Asia/Ho_Chi_Minh",
        });

        const emailContent = `
          <h2>Dear ${user.name},</h2>
          <p>This is a reminder that your vehicle <strong>${vehicle.carName} (${vehicle.carPlate})</strong> is scheduled for its next maintenance on <strong>${formattedDate}</strong>.</p>
          <h3>Garage Details:</h3>
          <ul>
            <li><strong>Garage Name:</strong> ${garage.name}</li>
          </ul>
          <p>Please ensure your vehicle is ready for maintenance on the scheduled date.</p>
          <p>Thank you for using our service!</p>
        `;

        try {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: user.email,
            subject: "Maintenance Reminder: Your Vehicle's Next Maintenance",
            html: emailContent,
          });
          console.log(`Reminder email sent to ${user.email}`);
        } catch (error) {
          console.error(
            `Failed to send email to ${user.email}:`,
            error.message
          );
        }
      }
    }
  } catch (error) {
    console.error(
      "Error in sending maintenance reminder emails:",
      error.message
    );
  }
};

// Separate function to handle email sending in background
async function sendCompletionEmail(
  appointmentId,
  customerId,
  garageId,
  staffId,
  startTime,
  endTime
) {
  try {
    // Get user and garage info for email
    const customer = await User.findById(customerId);
    const garageInfo = await Garage.findById(garageId).select(
      "name address phone"
    );
    const staffInfo = await User.findById(staffId).select("name");

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Send completion email to customer
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: customer.email,
      subject: "Dịch vụ của bạn đã hoàn thành",
      html: `
        <h2>Xin chào ${customer.name},</h2>
        <p>Dịch vụ của bạn đã <span style="color: #28a745; font-weight: bold;">hoàn thành</span>.</p>
        <h3>Chi tiết dịch vụ:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
          <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Nhân viên phụ trách:</strong> ${staffInfo.name}</li>
          <li><strong>Trạng thái:</strong> Đã hoàn thành</li>
        </ul>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
        <p>Vui lòng đánh giá trải nghiệm của bạn <a href="${process.env.FRONTEND_URL}/garageDetail/${garageInfo._id}">tại đây</a>.</p>
      `,
    });
  } catch (error) {
    console.error("Error in completion email process:", error);
  }
}

export const getAcceptedAppointmentsService = async (userId, garageId) => {
  const user = await User.findById(userId);
  if (!user) {
    throw new Error("User not found");
  }

  if (!user.garageList.includes(garageId)) {
    throw new Error("Unauthorized");
  }

  return await Appointment.find({ status: "Accepted", garage: garageId })
    .populate("user", "name email")
    .populate("garage", "name address")
    .populate("vehicle", "carBrand carName carPlate")
    .populate("service");
};

export const cancelAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  appointment.status = "Cancelled";
  await appointment.save();

  // Send cancellation emails asynchronously
  sendCancellationEmails(
    appointmentId,
    appointment.user,
    appointment.garage,
    appointment.start,
    appointment.end
  ).catch((error) =>
    console.error("Error sending cancellation emails:", error)
  );

  // Return immediately after saving
  return appointment;
};

// Separate function to handle email sending in background
async function sendCancellationEmails(
  appointmentId,
  customerId,
  garageId,
  startTime,
  endTime
) {
  try {
    // Get user and garage info for email
    const customer = await User.findById(customerId);
    const garageInfo = await Garage.findById(garageId).select(
      "name address phone"
    );

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Send cancellation email to customer
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: customer.email,
      subject: "Xác nhận hủy lịch hẹn",
      html: `
        <h2>Xin chào ${customer.name},</h2>
        <p>Lịch hẹn của bạn đã được hủy <span style="color: #28a745; font-weight: bold;">thành công</span>.</p>
        <h3>Chi tiết lịch hẹn đã hủy:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
          <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Trạng thái:</strong> Đã hủy</li>
        </ul>
        <p>Xem chi tiết lịch hẹn của bạn <a href="${process.env.FRONTEND_URL}/profile">tại đây</a>.</p>
        <p>Nếu bạn muốn đặt lịch hẹn mới, vui lòng truy cập trang web của chúng tôi.</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    });

    // Notify garage managers about the cancellation
    const roleManager = await Role.findOne({ roleName: "manager" });
    if (roleManager) {
      const garageManagers = await User.find({
        garageList: garageId,
        roles: roleManager._id,
      });

      if (garageManagers && garageManagers.length > 0) {
        for (const manager of garageManagers) {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: manager.email,
            subject: "Thông báo hủy lịch hẹn",
            html: `
              <h2>Xin chào ${manager.name},</h2>
              <p>Một lịch hẹn tại garage của bạn đã bị <span style="color: #dc3545; font-weight: bold;">hủy bỏ</span> bởi khách hàng.</p>
              <h3>Chi tiết lịch hẹn:</h3>
              <ul>
                <li><strong>Khách hàng:</strong> ${customer.name}</li>
                <li><strong>Email:</strong> ${customer.email}</li>
                <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
                <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
                <li><strong>Trạng thái:</strong> Đã hủy</li>
              </ul>
             <p>Xem chi tiết lịch hẹn <a href="${process.env.FRONTEND_URL}/garageManagement/${garageId}/appointments">tại đây</a>.</p>            `,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in cancellation email process:", error);
  }
}

export const updateAppointmentService = async (
  appointmentId,
  userId,
  updateData
) => {
  // Extract only allowed fields
  const allowedUpdates = {
    service: updateData.service,
    start: updateData.start,
    note: updateData.note,
  };

  // Remove undefined fields
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  // Validate update data
  const validation = updateAppointmentValidate(allowedUpdates);
  if (!validation.valid) {
    throw new Error(`Validation error: ${JSON.stringify(validation.errors)}`);
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  if (appointment.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "Pending") {
    throw new Error("Only pending appointments can be updated");
  }

  // Save old appointment data for email
  const oldStart = appointment.start;
  const oldEnd = appointment.end;

  let startTime = oldStart;
  let endTime = oldEnd;

  // Determine which service IDs to use for calculation
  const serviceIds = allowedUpdates.service || appointment.service;

  // Always recalculate end time if service or start is being updated
  if (allowedUpdates.service || allowedUpdates.start) {
    const newStartTime = allowedUpdates.start
      ? typeof allowedUpdates.start === "string"
        ? new Date(allowedUpdates.start)
        : allowedUpdates.start
      : appointment.start;

    // Use convertAndValidateDateTime for consistent date validation
    const validationResult = await convertAndValidateDateTime(
      newStartTime,
      serviceIds
    );
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    startTime = validationResult.startTime;
    endTime = validationResult.endTime;

    // Check for booking conflicts with consistent UTC date handling
    const bookingCheck = await checkBooking(
      appointment.vehicle,
      appointment.garage,
      startTime,
      endTime,
      appointmentId
    );

    if (bookingCheck.hasConflict) {
      throw new Error(
        bookingCheck.conflictMessage || "Booking conflict detected"
      );
    }
  }

  // Build the update object
  const updateOperation = {};
  updateOperation.$set = {};

  if (allowedUpdates.note !== undefined) {
    updateOperation.$set.note = allowedUpdates.note;
  }

  updateOperation.$set.start = startTime;
  updateOperation.$set.end = endTime;

  // Handle service array
  if (allowedUpdates.service) {
    updateOperation.$set.service = allowedUpdates.service;
  }

  // Update appointment in the database
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    updateOperation,
    { new: true }
  )
    .populate("garage")
    .populate("service");

  // Send update notification email asynchronously
  sendUpdateNotificationEmails(
    appointmentId,
    userId,
    updatedAppointment.garage._id,
    oldStart,
    oldEnd,
    startTime,
    endTime,
    allowedUpdates.note
  ).catch((error) =>
    console.error("Error sending update notification emails:", error)
  );

  // Return immediately after updating
  return updatedAppointment;
};

// Separate function to handle email sending in background
async function sendUpdateNotificationEmails(
  appointmentId,
  userId,
  garageId,
  oldStartTime,
  oldEndTime,
  newStartTime,
  newEndTime,
  note
) {
  try {
    // Get user and garage info for email
    const user = await User.findById(userId);
    const garageInfo = await Garage.findById(garageId).select("name address");

    // Format dates for email display in local time (Vietnam timezone)
    const oldDisplayDate = oldStartTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const oldDisplayStartTime = oldStartTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const oldDisplayEndTime = oldEndTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    const newDisplayDate = newStartTime.toLocaleDateString("vi-VN", {
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const newDisplayStartTime = newStartTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });
    const newDisplayEndTime = newEndTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "Asia/Ho_Chi_Minh",
    });

    // Determine what changed for better email content
    const timeChanged =
      oldStartTime.getTime() !== newStartTime.getTime() ||
      oldEndTime.getTime() !== newEndTime.getTime();

    // Send email to customer about the update
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: user.email,
      subject: "Thông báo cập nhật lịch hẹn",
      html: `
        <h2>Xin chào ${user.name},</h2>
        <p>Lịch hẹn của bạn đã được <span style="color: #007bff; font-weight: bold;">cập nhật</span>.</p>

        <h3>Thông tin trước khi cập nhật:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${oldDisplayDate}</li>
          <li><strong>Thời gian:</strong> ${oldDisplayStartTime} - ${oldDisplayEndTime}</li>
        </ul>

        <h3>Thông tin sau khi cập nhật:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garageInfo.name}</li>
          <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
          <li><strong>Ngày hẹn:</strong> ${newDisplayDate}</li>
          <li><strong>Thời gian:</strong> ${newDisplayStartTime} - ${newDisplayEndTime}</li>
          <li><strong>Ghi chú:</strong> ${note || "Không có"}</li>
          <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
        </ul>

        <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
        <p>Xem chi tiết lịch hẹn của bạn <a href="${
          process.env.FRONTEND_URL
        }/profile">tại đây</a>.</p>
        <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
      `,
    });

    // Notify garage managers about the update
    const roleManager = await Role.findOne({ roleName: "manager" });
    if (roleManager) {
      const garageManagers = await User.find({
        garageList: garageId,
        roles: roleManager._id,
      });

      if (garageManagers && garageManagers.length > 0) {
        for (const manager of garageManagers) {
          await transporter.sendMail({
            from: process.env.MAIL_USER,
            to: manager.email,
            subject: "Thông báo cập nhật lịch hẹn",
            html: `
              <h2>Xin chào ${manager.name},</h2>
              <p>Một lịch hẹn tại garage của bạn đã được <span style="color: #007bff; font-weight: bold;">cập nhật</span> bởi khách hàng.</p>

              <h3>Thông tin khách hàng:</h3>
              <ul>
                <li><strong>Tên:</strong> ${user.name}</li>
                <li><strong>Email:</strong> ${user.email}</li>
              </ul>

              <h3>Thông tin trước khi cập nhật:</h3>
              <ul>
                <li><strong>Ngày hẹn:</strong> ${oldDisplayDate}</li>
                <li><strong>Thời gian:</strong> ${oldDisplayStartTime} - ${oldDisplayEndTime}</li>
              </ul>

              <h3>Thông tin sau khi cập nhật:</h3>
              <ul>
                <li><strong>Ngày hẹn:</strong> ${newDisplayDate}</li>
                <li><strong>Thời gian:</strong> ${newDisplayStartTime} - ${newDisplayEndTime}</li>
                <li><strong>Ghi chú:</strong> ${note || "Không có"}</li>
                <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
              </ul>

              <p>Vui lòng đăng nhập vào hệ thống để xác nhận hoặc từ chối lịch hẹn này.</p>
              <p>Xem chi tiết lịch hẹn <a href="${process.env.FRONTEND_URL}/garageManagement/${garageId}/appointments">tại đây</a>.</p>
            `,
          });
        }
      }
    }
  } catch (error) {
    console.error("Error in update notification email process:", error);
  }
}

export const isCalledAppointmentService = async (appointmentId) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    appointment.isCalled = true;
    await appointment.save();
  } catch (error) {
    console.error("Error in update notification email process:", error);
  }
};
