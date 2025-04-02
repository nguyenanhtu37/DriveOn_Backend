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

  // Create date objects for today's garage operating hours
  const appointmentDate = new Date(start);
  const appointmentDay = appointmentDate.toISOString().split("T")[0];

  const [garageOpenHour, garageOpenMinute] = garage.openTime.split(":").map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime.split(":").map(Number);

  // Create proper UTC times for garage hours
  const garageOpenTime = new Date(appointmentDate);
  const garageCloseTime = new Date(appointmentDate);

  // Set hours directly to UTC values
  garageOpenTime.setUTCHours(garageOpenHour, garageOpenMinute, 0, 0);
  garageCloseTime.setUTCHours(garageCloseHour, garageCloseMinute, 0, 0);

  // Check if appointment is within garage's operating hours
  if (start < garageOpenTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`
    };
  }

  if (end > garageCloseTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage closes at ${garage.closeTime}`
    };
  }

  // Check if vehicle is already booked at any garage during this time
  const overlappingAppointments = await Appointment.find({
    vehicle: vehicleId,
    _id: { $ne: currentAppointmentId }, // Exclude current appointment if updating
    $or: [
      // Start time falls within existing appointment
      { start: { $lte: start }, end: { $gt: start } },
      // End time falls within existing appointment
      { start: { $lt: end }, end: { $gte: end } },
      // New appointment completely contains existing appointment
      { start: { $gte: start, $lt: end } }
    ],
    status: { $nin: ["Cancelled", "Rejected"] } // Ignore cancelled/rejected appointments
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
    // Get current time in UTC
    const nowUtc = new Date();

    // Add UTC+7 offset to account for Vietnam timezone
    const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const nowVietnam = new Date(nowUtc.getTime() + vietnamOffset);

    // Convert start to Date if it's a string
    const startTime = typeof start === 'string' ? new Date(start) : start;

    // Check if startTime is a valid date
    if (isNaN(startTime.getTime())) {
      throw new Error("Invalid date format. Please provide a valid date and time.");
    }

    // FUTURE TIME VALIDATION - compare with Vietnam time
    if (startTime <= nowVietnam) {
      throw new Error("Appointment time must be in the future");
    }

    // Calculate service duration
    let totalDurationMinutes = 0;

    for (const serviceId of serviceIds) {
      const serviceDetail = await ServiceDetail.findById(serviceId);

      if (!serviceDetail) {
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      // Get duration directly as a number (minutes)
      const durationMinutes = serviceDetail.duration || 60; // Default to 60 minutes if not set
      totalDurationMinutes += durationMinutes;
    }

    // Calculate end time by adding total duration
    const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);

    return {
      startTime,
      endTime,
      isValid: true,
      error: null,
    };
  } catch (error) {
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

  // Check for booking conflicts - pass directly to checkBooking with UTC times
  const bookingCheck = await checkBooking(vehicle, garage, validatedStartTime, endTime);
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
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
        <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
      </ul>
      <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  const roleStaff = await Role.findOne({ roleName: "staff" });
  if (!roleStaff) {
    console.log('Role "staff" not found');
    return;
  }

  const garageOwners = await User.find({
    garageList: garage,
    roles: roleStaff._id // Chỉ tìm người có vai trò "staff"
  });
    if (garageOwners && garageOwners.length > 0) {
    for (const owner of garageOwners) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: owner.email,
        subject: "Thông báo lịch hẹn mới",
        html: `
          <h2>Xin chào ${owner.name},</h2>
          <p>Garage của bạn vừa nhận được một lịch hẹn mới.</p>
          <h3>Chi tiết lịch hẹn:</h3>
          <ul>
            <li><strong>Khách hàng:</strong> ${user.name}</li>
            <li><strong>Số điện thoại:</strong> ${user.phone || 'Không có'}</li>
            <li><strong>Xe:</strong> ${vehicleInfo.carName} (${vehicleInfo.carPlate})</li>
            <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
            <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
            <li><strong>Ghi chú:</strong> ${note || 'Không có'}</li>
          </ul>
          <p>Xem chi tiết lịch hẹn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>
          <p>Vui lòng kiểm tra và xác nhận lịch hẹn càng sớm càng tốt.</p>
        `
      });
    }
  }

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
      .populate("user", "name email")
      .populate("garage", "name address")
      .populate("vehicle", "carBrand carName carPlate")
      .populate("service"," name description price duration");
};

export const getAppointmentsByGarageService = async (garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return await Appointment.find({ garage: garageId })
      .populate("user", "name email")
      .populate("garage", "name address")
      .populate("vehicle", "carBrand carName carPlate")
      .populate("service");
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

  // Also notify the garage about the cancellation
  const roleStaff = await Role.findOne({ roleName: "staff" });
  if (!roleStaff) {
    console.log('Role "staff" not found');
    return;
  }

  const garageOwners = await User.find({
    garageList: appointment.garage,
    roles: roleStaff._id // Chỉ tìm người có vai trò "staff"
  });
  if (garageOwners && garageOwners.length > 0) {
    for (const owner of garageOwners) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: owner.email,
        subject: "Thông báo hủy lịch hẹn",
        html: `
          <h2>Xin chào ${owner.name},</h2>
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

  // Always recalculate end time if service is being updated
  if (allowedUpdates.service || allowedUpdates.start) {
    const newStartTime = allowedUpdates.start ?
        (typeof allowedUpdates.start === 'string' ? new Date(allowedUpdates.start) : allowedUpdates.start) :
        oldStart;

    // Recalculate duration based on selected services
    const validationResult = await convertAndValidateDateTime(newStartTime, serviceIds);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    startTime = validationResult.startTime;
    endTime = validationResult.endTime;

    // Check for booking conflicts
    const bookingCheck = await checkBooking(
        appointment.vehicle,
        appointment.garage,
        startTime,
        endTime,
        appointmentId
    );

    if (bookingCheck.hasConflict) {
      throw new Error(bookingCheck.conflictMessage || "Booking conflict detected");
    }
  }

  // Build the update object manually to ensure proper handling of array fields
  const updateOperation = {};

  // Set individual fields
  if (allowedUpdates.note !== undefined) {
    updateOperation.$set = updateOperation.$set || {};
    updateOperation.$set.note = allowedUpdates.note;
  }

  updateOperation.$set = updateOperation.$set || {};
  updateOperation.$set.start = startTime;
  updateOperation.$set.end = endTime;

  // Handle service array specially
  if (allowedUpdates.service) {
    // Replace the entire service array - update directly
    updateOperation.$set.service = allowedUpdates.service;
  }

  // Update appointment in the database
  const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      updateOperation,
      { new: true, runValidators: true }  // Ensure validators run and return the updated doc
  );
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