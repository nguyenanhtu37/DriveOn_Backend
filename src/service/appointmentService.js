import Appointment from "../models/appointment.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import { updateAppointmentValidate, createAppointmentValidate } from "../validator/appointmentValidator.js";
import transporter from "../config/mailer.js";



// Helper function to check for double bookings and validate time range
const checkBooking = async (vehicleId, garageId, date, start, end, currentAppointmentId = null) => {
  const appointmentDate = new Date(date);
  const appointmentDay = appointmentDate.toISOString().split("T")[0];

  // Get garage operating hours
  const garage = await Garage.findById(garageId);
  if (!garage) {
    return {
      hasConflict: true,
      conflictMessage: "Garage not found"
    };
  }

  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  // Get garage operating hours
  const [garageOpenHour, garageOpenMinute] = garage.openTime.split(":").map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime.split(":").map(Number);

  // Convert to minutes for easy comparison
  const startTimeInMinutes = startHour * 60 + startMinute;
  const endTimeInMinutes = endHour * 60 + endMinute;
  const garageOpenTimeInMinutes = garageOpenHour * 60 + garageOpenMinute;
  const garageCloseTimeInMinutes = garageCloseHour * 60 + garageCloseMinute;

  // Check if appointment is within garage's operating hours
  if (startTimeInMinutes < garageOpenTimeInMinutes) {
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`
    };
  }

  if (endTimeInMinutes > garageCloseTimeInMinutes) {
    return {
      hasConflict: true,
      conflictMessage: `Garage closes at ${garage.closeTime}`
    };
  }

  const startTime = new Date(appointmentDate);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(appointmentDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  const query = {
    vehicle: vehicleId,
    date: { $gte: new Date(`${appointmentDay}T00:00:00.000Z`), $lt: new Date(`${appointmentDay}T23:59:59.999Z`) },
    status: { $nin: ["Rejected", "Cancelled"] }
  };

  if (currentAppointmentId) {
    query._id = { $ne: currentAppointmentId };
  }

  const existingAppointments = await Appointment.find(query);

  for (const appointment of existingAppointments) {
    const [apptStartHour, apptStartMinute] = appointment.start.split(":").map(Number);
    const [apptEndHour, apptEndMinute] = appointment.end.split(":").map(Number);

    const apptStartTime = new Date(appointment.date);
    apptStartTime.setHours(apptStartHour, apptStartMinute, 0, 0);

    const apptEndTime = new Date(appointment.date);
    apptEndTime.setHours(apptEndHour, apptEndMinute, 0, 0);

    if (startTime < apptEndTime && endTime > apptStartTime) {
      return {
        hasConflict: true,
        conflictMessage: "This vehicle is already booked at another garage during this time period",
        conflictGarage: appointment.garage
      };
    }
  }

  return { hasConflict: false };
};

const convertAndValidateDateTime = (date, start, end) => {
  try {
    const nowUtc = new Date(); // Get current system time (UTC)
    const nowGmt7 = new Date(nowUtc.getTime() + 7 * 60 * 60 * 1000); // Convert to GMT+7

    const appointmentDate = new Date(`${date}T00:00:00.000Z`);

    const appointmentStart = new Date(`${date}T${start}:00.000Z`);
    const appointmentEnd = new Date(`${date}T${end}:00.000Z`);

    if (appointmentStart <= nowGmt7) {
      throw new Error("Start time must be in the future");
    }
    if (appointmentEnd <= appointmentStart) {
      throw new Error("End time must be after start time");
    }

    return {
      date: appointmentDate,
      startTime: appointmentStart,
      endTime: appointmentEnd,
      isValid: true,
      error: null,
    };
  } catch (error) {
    return {
      date: null,
      startTime: null,
      endTime: null,
      isValid: false,
      error: error.message
    };
  }
};

export const createAppointmentService = async ({
                                                 userId, garage, service, vehicle, date, start, end, tag, note,
                                               }) => {
  const { valid, errors } = createAppointmentValidate({
    user: userId,
    garage,
    service,
    vehicle,
    date,
    start,
    end,
    tag,
    note,
  });

  if (!valid) {
    const errorMessages = errors.map(error => error.message).join(", ");
    throw new Error(errorMessages);
  }

  const { startTime, endTime, isValid, error } = convertAndValidateDateTime(date, start, end);
  if (!isValid) {
    throw new Error(error);
  }

  const bookingCheck = await checkBooking(vehicle, garage, startTime, start, end);
  if (bookingCheck.hasConflict) {
    throw new Error(bookingCheck.conflictMessage || "Booking conflict detected");
  }

  const newAppointment = new Appointment({
    user: userId,
    garage,
    service,
    vehicle,
    date: startTime,
    start,
    end,
    status: "Pending",
    tag,
    note

  });

  await newAppointment.save();
  // Lấy thông tin người dùng để gửi email
  const user = await User.findById(userId);
  const garageInfo = await Garage.findById(garage).select('name address');


  // Gửi email xác nhận đặt lịch
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
      <li><strong>Ngày hẹn:</strong> ${date}</li>
      <li><strong>Thời gian:</strong> ${start} - ${end}</li>
      <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
    </ul>
    <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>

    <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
  `
  });
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

  // Format date for display
  const displayDate = appointment.date.toISOString().split('T')[0];

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
        <li><strong>Thời gian:</strong> ${appointment.start} - ${appointment.end}</li>
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

  // Format date for display
  const displayDate = appointment.date.toISOString().split('T')[0];

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
        <li><strong>Thời gian:</strong> ${appointment.start} - ${appointment.end}</li>
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
  const displayDate = appointment.date.toISOString().split('T')[0];

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
        <li><strong>Thời gian:</strong> ${appointment.start} - ${appointment.end}</li>
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

  // Format date for display
  const displayDate = appointment.date.toISOString().split('T')[0];

  // Send cancellation email to customer
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: customer.email,
    subject: "Xác nhận hủy lịch hẹn",
    html: `
      <h2>Xin chào ${customer.name},</h2>
      <p>Lịch hẹn của bạn đã được hủy thành công.</p>
      <h3>Chi tiết lịch hẹn đã hủy:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${appointment.start} - ${appointment.end}</li>
      </ul>
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>
      <p>Nếu bạn muốn đặt lịch hẹn mới, vui lòng truy cập trang web của chúng tôi.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  // Also notify the garage about the cancellation
  const garageOwners = await User.find({ garageList: appointment.garage });
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
            <li><strong>Thời gian:</strong> ${appointment.start} - ${appointment.end}</li>
          </ul>
          <p>Xem chi tiết lịch hẹn <a href="http://localhost:${process.env.PORT}/api/appointment/${appointment._id}">tại đây</a>.</p>
        `
      });
    }
  }

  return appointment;
};

export const updateAppointmentService = async (appointmentId, userId, updateData) => {
  const { valid, errors } = updateAppointmentValidate(updateData);
  if (!valid) {
    const errorMessages = errors.map(error => error.message).join(", ");
    throw new Error(errorMessages);
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

  // Lưu thông tin lịch hẹn cũ để hiển thị trong email
  const oldDate = appointment.date.toISOString().split('T')[0];
  const oldStart = appointment.start;
  const oldEnd = appointment.end;

  if (updateData.date || updateData.start || updateData.end) {
    const { startTime, endTime, isValid, error } = convertAndValidateDateTime(
        updateData.date || oldDate,
        updateData.start || oldStart,
        updateData.end || oldEnd
    );

    if (!isValid) {
      throw new Error(error);
    }

    updateData.date = startTime;
    updateData.start = updateData.start || oldStart;
    updateData.end = updateData.end || oldEnd;

    const bookingCheck = await checkBooking(
        updateData.vehicle || appointment.vehicle,
        updateData.garage || appointment.garage,
        updateData.date,
        updateData.start,
        updateData.end,
        appointmentId
    );

    if (bookingCheck.hasConflict) {
      throw new Error("This vehicle is already booked at another garage during this time period");
    }
  }


  const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: updateData },
      { new: true, runValidators: true }
  );

  // Lấy thông tin người dùng và garage để gửi email
  const user = await User.findById(userId);
  const garageInfo = await Garage.findById(updatedAppointment.garage).select('name address');

  // Format date for display
  const displayDate = updatedAppointment.date.toISOString().split('T')[0];

  // Gửi email thông báo cập nhật lịch hẹn
  await transporter.sendMail({
    from: process.env.MAIL_USER,
    to: user.email,
    subject: "Thông báo cập nhật lịch hẹn",
    html: `
      <h2>Xin chào ${user.name},</h2>
      <p>Lịch hẹn của bạn đã được cập nhật thành công.</p>
      
      <h3>Thông tin cũ:</h3>
      <ul>
        <li><strong>Ngày hẹn:</strong> ${oldDate}</li>
        <li><strong>Thời gian:</strong> ${oldStart} - ${oldEnd}</li>
      </ul>
      
      <h3>Thông tin mới:</h3>
      <ul>
        <li><strong>Garage:</strong> ${garageInfo.name}</li>
        <li><strong>Địa chỉ:</strong> ${garageInfo.address}</li>
        <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
        <li><strong>Thời gian:</strong> ${updatedAppointment.start} - ${updatedAppointment.end}</li>
        <li><strong>Trạng thái:</strong> Đang chờ xác nhận</li>
      </ul>
      
      <p>Xem chi tiết lịch hẹn của bạn <a href="http://localhost:${process.env.PORT}/api/appointment/${updatedAppointment._id}">tại đây</a>.</p>
      <p>Garage sẽ xem xét và xác nhận lịch hẹn của bạn sớm nhất có thể.</p>
      <p>Cảm ơn bạn đã sử dụng dịch vụ của chúng tôi!</p>
    `
  });

  return updatedAppointment;
};