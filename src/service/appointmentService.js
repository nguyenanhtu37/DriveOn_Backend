import Appointment from "../models/appointment.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import { updateAppointmentValidate, createAppointmentValidate } from "../validator/appointmentValidator.js";
import transporter from "../config/mailer.js";
import Vehicle from "../models/vehicle.js";
import ServiceDetail
  from "../models/serviceDetail.js";
import Role from "../models/role.js";
// Helper function to format time directly from UTC without timezone conversion
const formatTimeDisplay = (date) => {
  return `${date.getUTCHours()}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
};
const checkBooking = async (vehicleId, garageId, start, end, currentAppointmentId = null) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    return {
      hasConflict: true,
      conflictMessage: "Garage not found"
    };
  }

  // Fix: use getUTCDay() for consistency with convertAndValidateDateTime
  const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const appointmentDay = daysOfWeek[start.getUTCDay()];
  console.log(`CheckBooking - day of week: ${appointmentDay} (index: ${start.getUTCDay()})`);

  // Check if garage operates on start day
  if (!garage.operating_days.includes(appointmentDay)) {
    return {
      hasConflict: true,
      conflictMessage: `Garage is closed on ${appointmentDay}s`
    };
  }

  // Get operating hours for the start day
  const [garageOpenHour, garageOpenMinute] = garage.openTime.split(":").map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime.split(":").map(Number);

  // Create proper UTC times for garage hours on appointment day
  const garageOpenTime = new Date(start);
  garageOpenTime.setUTCHours(garageOpenHour, garageOpenMinute, 0, 0);

  // Check if appointment starts before opening time
  if (start < garageOpenTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`
    };
  }

  // For appointments that span to the next day, we don't need to check closing time
  // because convertAndValidateDateTime already handled that

  // Check for existing appointments
  const overlappingAppointments = await Appointment.find({
    vehicle: vehicleId,
    _id: { $ne: currentAppointmentId },
    $or: [
      // Overlapping start
      { start: { $lte: start }, end: { $gt: start } },
      // Overlapping end
      { start: { $lt: end }, end: { $gte: end } },
      // Appointment within new booking
      { start: { $gte: start, $lt: end } }
    ],
    status: { $nin: ["Cancelled", "Rejected"] }
  });

  if (overlappingAppointments.length > 0) {
    const conflictGarage = await Garage.findById(overlappingAppointments[0].garage);
    const garageName = conflictGarage ? conflictGarage.name : "another garage";

    return {
      hasConflict: true,
      conflictMessage: `Vehicle is already scheduled at ${garageName} during this time`
    };
  }

  return { hasConflict: false };
};

const convertAndValidateDateTime = async (start, serviceIds) => {
  try {
    // Log input parameters
    console.log("Input - start:", start);
    console.log("Input - serviceIds:", JSON.stringify(serviceIds));

    // Define days of week array
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    // Parse start time and ensure it's in UTC
    const startTime = typeof start === 'string' ? new Date(start) : start;
    console.log("Parsed startTime:", startTime.toISOString());

    // Get day of week using getUTCDay to ensure consistency
    const dayIndex = startTime.getUTCDay();
    const dayOfWeek = daysOfWeek[dayIndex];
    console.log(`Day of week (UTC): ${dayOfWeek} (index: ${dayIndex})`);

    if (isNaN(startTime.getTime())) {
      throw new Error("Invalid date format. Please provide a valid date and time.");
    }

    // Get current time in UTC
    const nowUtc = new Date();
    if (startTime <= nowUtc) {
      throw new Error("Appointment time must be in the future");
    }

    // Find the first service to get the garage
    console.log("Looking up first service with ID:", serviceIds[0]);
    const firstService = await ServiceDetail.findById(serviceIds[0]);
    if (!firstService) {
      throw new Error("Service not found");
    }

    // Look up the garage
    console.log("Looking up garage with ID:", firstService.garage);
    const garage = await Garage.findById(firstService.garage);
    if (!garage) {
      throw new Error("Garage not found");
    }

    console.log("Garage operating days:", garage.operating_days);
    console.log(`Checking if garage operates on ${dayOfWeek}`);

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

    // Parse garage operating hours
    const [openHour, openMinute] = garage.openTime.split(":").map(Number);
    const [closeHour, closeMinute] = garage.closeTime.split(":").map(Number);

    // Create garage open and close times for the appointment day
    const garageOpenTime = new Date(startTime);
    garageOpenTime.setUTCHours(openHour, openMinute, 0, 0);

    const garageCloseTime = new Date(startTime);
    garageCloseTime.setUTCHours(closeHour, closeMinute, 0, 0);

    // Check if appointment starts before opening time
    if (startTime < garageOpenTime) {
      throw new Error(`Garage opens at ${garage.openTime}`);
    }

    // Calculate initial end time
    let endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);

    // If appointment would end after closing time, extend to next operating day
    if (endTime > garageCloseTime) {
      console.log("Appointment extends past closing time");
      console.log("Current endTime:", endTime);
      console.log("Garage closing time:", garageCloseTime);

      // Calculate remaining minutes after closing time
      const minutesOverClosing = Math.floor((endTime - garageCloseTime) / 60000);
      console.log("Minutes over closing time:", minutesOverClosing);

      // Find the next operating day
      let nextDayIndex = (startTime.getUTCDay() + 1) % 7;
      let daysToAdd = 1;

      console.log("Starting search for next operating day");
      console.log("Initial nextDayIndex:", nextDayIndex, "->", daysOfWeek[nextDayIndex]);
      console.log("Initial daysToAdd:", daysToAdd);

      while (!garage.operating_days.includes(daysOfWeek[nextDayIndex])) {
        console.log(`${daysOfWeek[nextDayIndex]} is not an operating day, checking next day`);
        nextDayIndex = (nextDayIndex + 1) % 7;
        daysToAdd++;
        console.log("Updated nextDayIndex:", nextDayIndex, "->", daysOfWeek[nextDayIndex]);
        console.log("Updated daysToAdd:", daysToAdd);
      }

      console.log("Found next operating day:", daysOfWeek[nextDayIndex]);
      console.log("Days to add:", daysToAdd);

      // Create the next operating day's opening time
      const nextDayOpenTime = new Date(startTime);
      nextDayOpenTime.setUTCDate(nextDayOpenTime.getUTCDate() + daysToAdd);
      nextDayOpenTime.setUTCHours(openHour, openMinute, 0, 0);
      console.log("Next day opening time:", nextDayOpenTime);

      // Set end time to opening time of next day + remaining minutes
      endTime = new Date(nextDayOpenTime.getTime() + minutesOverClosing * 60000);
      console.log("Final calculated endTime:", endTime);
    }

    return {
      startTime,
      endTime,
      isValid: true,
      error: null,
    };
  } catch (error) {
    console.error("Validation error:", error.message);
    return {
      startTime: null,
      endTime: null,
      isValid: false,
      error: error.message
    };
  }
};

export const createAppointmentService = async ({
                                                 userId, garage, service, vehicle, start, tag, note,
                                               }) => {
  // Validate with zod schema
  const validation = createAppointmentValidate({ garage, service, vehicle, start, tag, note });
  if (!validation.valid) {
    throw new Error(`Validation error: ${JSON.stringify(validation.errors)}`);
  }

  // Convert start to Date if it's a string
  const startTime = typeof start === 'string' ? new Date(start) : start;

  // Calculate end time based on service durations
  const { startTime: validatedStartTime, endTime, isValid, error } =
      await convertAndValidateDateTime(startTime, service);

  if (!isValid) {
    throw new Error(error);
  }

  // Get the first service to use its garage ID (if needed)
  const firstService = await ServiceDetail.findById(service[0]);
  if (!firstService) {
    throw new Error("Service not found");
  }

  // Check for booking conflicts - pass directly to checkBooking with UTC times
  const bookingCheck = await checkBooking(
      vehicle,
      garage, // Use the garage ID passed to the function
      validatedStartTime,
      endTime
  );

  if (bookingCheck && bookingCheck.hasConflict) {
    throw new Error(bookingCheck.conflictMessage || "Booking conflict detected");
  }

  const newAppointment = new Appointment({
    user: userId,
    garage,
    service,
    vehicle,
    start: validatedStartTime,
    end: endTime,
    status: "Pending",
    tag,
    note
  });

  await newAppointment.save();

  // Retrieve information for email
  const user = await User.findById(userId);
  const garageInfo = await Garage.findById(garage).select('name address');
  const vehicleInfo = await Vehicle.findById(vehicle).select(' carName carPlate');


  // Format dates for display - format UTC time directly without timezone conversion
  const displayDate = validatedStartTime.toLocaleDateString('vi-VN');
  const displayStartTime = formatTimeDisplay(validatedStartTime);
  const displayEndTime = formatTimeDisplay(endTime);
  // // Send confirmation email to customer
  // await transporter.sendMail({
  //   from: process.env.MAIL_USER,
  //   to: user.email,
  //   subject: "Xác nhận đặt lịch hẹn",
  //   html: `
  //     <h2>Xin chào ${user.name},</h2>
  //     <p>Bạn đã đặt lịch hẹn thành công tại hệ thống của chúng tôi.</p>
  //     <h3>Chi tiết lịch hẹn:</h3>
  //     <ul>
  //       <li><strong>Garage:</strong> ${garageInfo.name}</li>
  //       <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
  //       <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
  //       <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
  //       <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
  //     </ul>
  //     <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
  //     <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>
  //     <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
  //   `
  // });
  //
  // // In createAppointmentService, modify the garage notification part:
  // const roleManager = await Role.findOne({ roleName: "manager" });
  // if (!roleManager) {
  //   console.log('Role "manager" not found');
  //   return newAppointment;
  // }
  //
  // const garageManagers = await User.find({
  //   garageList: garage,
  //   roles: roleManager._id // Find users with "manager" role
  // });
  //
  // if (garageManagers && garageManagers.length > 0) {
  //   for (const manager of garageManagers) {
  //     await transporter.sendMail({
  //       from: process.env.MAIL_USER,
  //       to: manager.email,
  //       subject: "Thông báo lịch hẹn mới",
  //       html: `
  //       <h2>Xin chào ${manager.name},</h2>
  //       <p>Garage của bạn vừa nhận được một lịch hẹn mới.</p>
  //       <h3>Chi tiết lịch hẹn:</h3>
  //       <ul>
  //         <li><strong>Khách hàng:</strong> ${user.name}</li>
  //         <li><strong>Số điện thoại:</strong> ${user.phone || 'Không có'}</li>
  //         <li><strong>Xe:</strong> ${vehicleInfo.carName} (${vehicleInfo.carPlate})</li>
  //         <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
  //         <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
  //         <li><strong>Ghi chú:</strong> ${note || 'Không có'}</li>
  //       </ul>
  //       <p>Xem chi tiết lịch hẹn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>
  //       <p>Vui lòng kiểm tra và xác nhận lịch hẹn càng sớm càng tốt.</p>
  //     `
  //     });
  //   }
  // }

  return newAppointment;
};

export const getAppointmentsByUserService = async (userId) => {
  return await Appointment.find({ user: userId })
      .populate("user", "name email")
      .populate("garage", "name address")
      .populate("vehicle", "carBrand carName carPlate")
      .populate("service","");
};

export const getAppointmentByIdService = async (appointmentId) => {
  return await Appointment.findById(appointmentId)
    .populate("user", "avatar name email locale phone") // Select basic user information
    .populate("garage", "name address") // Select basic garage information
    .populate("vehicle", "carBrand carName carPlate") // Select basic vehicle information
    .populate("service"); // Populate service details
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

  // Get user and garage info for email
  const customer = await User.findById(appointment.user);
  const garageInfo = await Garage.findById(appointment.garage).select('name address');

  // Format dates for display - format UTC time directly without timezone conversion
  const displayDate = appointment.start.toLocaleDateString('vi-VN');
  const displayStartTime = formatTimeDisplay(appointment.start);
  const displayEndTime = formatTimeDisplay(appointment.end);
  // Send confirmation email to customer
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer.email,
    subject: "Lịch hẹn của bạn đã được xác nhận",
    html: `
      <h2>Xin chào ${customer.name},</h2>
      <p>Lịch hẹn của bạn đã được xác nhận bởi garage.</p>
      <h3>Chi tiết lịch hẹn:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
        <li><strong>Trạng thái:</strong> Đã xác nhận</li>
      </ul>
      <p>Vui lòng đến đúng giờ. Nếu bạn cần thay đổi lịch hẹn, vui lòng liên hệ với garage.</p>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  return appointment;
};
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

  // Get user and garage info for email
  const customer = await User.findById(appointment.user);
  const garageInfo = await Garage.findById(appointment.garage).select('name address');

  // Format dates for display - format UTC time directly without timezone conversion
  const displayDate = appointment.start.toLocaleDateString('vi-VN');
  const displayStartTime = formatTimeDisplay(appointment.start);
  const displayEndTime = formatTimeDisplay(appointment.end);

  // Send rejection email to customer
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer.email,
    subject: "Lịch hẹn của bạn đã bị từ chối",
    html: `
      <h2>Xin chào ${customer.name},</h2>
      <p>Rất tiếc, lịch hẹn của bạn đã bị từ chối bởi garage.</p>
      <h3>Chi tiết lịch hẹn:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
      </ul>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>

      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  return appointment;
};


export const completeAppointmentService = async (appointmentId, userId) => {
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

  appointment.status = "Completed";
  await appointment.save();

  // Get user and garage info for email
  const customer = await User.findById(appointment.user);
  const garageInfo = await Garage.findById(appointment.garage).select('name address');

  // Format date for display
  // Format dates for display - format UTC time directly without timezone conversion
  const displayDate = appointment.start.toLocaleDateString('vi-VN');
  const displayStartTime = formatTimeDisplay(appointment.start);
  const displayEndTime = formatTimeDisplay(appointment.end);

  // Send completion email to customer
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer.email,
    subject: "Dịch vụ của bạn đã hoàn thành",
    html: `
      <h2>Xin chào ${customer.name},</h2>
      <p>Dịch vụ của bạn đã được hoàn thành.</p>
      <h3>Chi tiết lịch hẹn:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
         <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
        <li><strong>Trạng thái:</strong> Đã hoàn thành</li>
      </ul>      
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>

      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  return appointment;
};
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

  // Get user and garage info for email
  const customer = await User.findById(appointment.user);
  const garageInfo = await Garage.findById(appointment.garage).select('name address phone');

  // Format dates for display - format UTC time directly without timezone conversion
  const displayDate = appointment.start.toLocaleDateString('vi-VN');
  const displayStartTime = formatTimeDisplay(appointment.start);
  const displayEndTime = formatTimeDisplay(appointment.end);

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
      </ul>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>
      <p>Nếu bạn muốn đặt lịch hẹn mới, vui lòng truy cập trang web của chúng tôi.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  // Notify garage managers about the cancellation
  const roleManager = await Role.findOne({ roleName: "manager" });
  if (!roleManager) {
    console.log('Role "manager" not found');
    return appointment;
  }

  const garageManagers = await User.find({
    garageList: appointment.garage,
    roles: roleManager._id // Find users with "manager" role
  });

  if (garageManagers && garageManagers.length > 0) {
    for (const manager of garageManagers) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: manager.email,
        subject: "Thông báo hủy lịch hẹn",
        html: `
          <h2>Xin chào ${manager.name},</h2>
          <p>Một khách hàng đã hủy lịch hẹn.</p>
          <h3>Chi tiết lịch hẹn đã hủy:</h3>
          <ul>
            <li><strong>Khách hàng:</strong> ${customer.name}</li>
            <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
            <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
          </ul>
          <p>Xem chi tiết lịch hẹn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>
        `
      });
    }
  }

  return appointment;
};

export const updateAppointmentService = async (appointmentId, userId, updateData) => {
  // Extract only allowed fields
  const allowedUpdates = {
    service: updateData.service,
    start: updateData.start,
    note: updateData.note
  };

  // Remove undefined fields
  Object.keys(allowedUpdates).forEach(key =>
      allowedUpdates[key] === undefined && delete allowedUpdates[key]
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

  // Save old appointment times for email
  const oldStart = appointment.start;
  const oldEnd = appointment.end;

  let startTime = oldStart;
  let endTime = oldEnd;

  // Determine which service IDs to use for calculation
  const serviceIds = allowedUpdates.service || appointment.service;

  console.log("Update - original startTime:", oldStart.toISOString());
  console.log("Update - service IDs:", JSON.stringify(serviceIds));

  // Always recalculate end time if service or start is being updated
  if (allowedUpdates.service || allowedUpdates.start) {
    const newStartTime = allowedUpdates.start ?
        (typeof allowedUpdates.start === 'string' ? new Date(allowedUpdates.start) : allowedUpdates.start) :
        oldStart;

    console.log("Update - new startTime:", newStartTime.toISOString());

    // Use convertAndValidateDateTime for consistent date validation
    const validationResult = await convertAndValidateDateTime(newStartTime, serviceIds);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    startTime = validationResult.startTime;
    endTime = validationResult.endTime;

    console.log("Update - validated startTime:", startTime.toISOString());
    console.log("Update - calculated endTime:", endTime.toISOString());

    // Check for booking conflicts with consistent UTC date handling
    const bookingCheck = await checkBooking(
        appointment.vehicle,
        appointment.garage,
        startTime,
        endTime,
        appointmentId // Exclude current appointment from conflict check
    );

    if (bookingCheck.hasConflict) {
      throw new Error(bookingCheck.conflictMessage || "Booking conflict detected");
    }
  }

  // Build the update object
  const updateOperation = {};

  // Set individual fields
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
      { new: true, runValidators: true }
  );

  console.log("Update - appointment updated successfully");

  // Send email notification about the update
  const user = await User.findById(userId);
  const garageInfo = await Garage.findById(updatedAppointment.garage).select('name address');

  // Format dates for email using formatTimeDisplay
  const oldDisplayDate = oldStart.toLocaleDateString('vi-VN');
  const oldDisplayStartTime = formatTimeDisplay(oldStart);
  const oldDisplayEndTime = formatTimeDisplay(oldEnd);

  const newDisplayDate = startTime.toLocaleDateString('vi-VN');
  const newDisplayStartTime = formatTimeDisplay(startTime);
  const newDisplayEndTime = formatTimeDisplay(endTime);

  // Send email about the update
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: user.email,
    subject: "Thông báo cập nhật lịch hẹn",
    html: `
      <h2>Xin chào ${user.name},</h2>
      <p>Lịch hẹn của bạn đã được cập nhật thành công.</p>

      <h3>Thông tin cũ:</h3>
      <ul>
        <li><strong>Ngày hẹn:</strong> ${oldDisplayDate}</li>
        <li><strong>Thời gian:</strong> ${oldDisplayStartTime} - ${oldDisplayEndTime}</li>
      </ul>

      <h3>Thông tin mới:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${newDisplayDate}</li>
        <li><strong>Thời gian:</strong> ${newDisplayStartTime} - ${newDisplayEndTime}</li>
        <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
      </ul>

      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${updatedAppointment._id}">tại đây</a>.</p>
      <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  return updatedAppointment;
};