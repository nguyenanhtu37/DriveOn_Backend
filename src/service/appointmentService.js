import Appointment from "../models/appointment.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import { updateAppointmentValidate, createAppointmentValidate } from "../validator/appointmentValidator.js";
import transporter from "../config/mailer.js";
import Vehicle from "../models/vehicle.js";
import ServiceDetail
  from "../models/serviceDetail.js";

const checkBooking = async (vehicleId, garageId, start, end, currentAppointmentId = null) => {
  // Get garage operating hours
  console.log("=== START: checkBooking ===");
  console.log(`Input start time: ${start.toISOString()}`);
  console.log(`Input end time: ${end.toISOString()}`);

  const garage = await Garage.findById(garageId);
  if (!garage) {
    console.log("Garage not found");
    return {
      hasConflict: true,
      conflictMessage: "Garage not found"
    };
  }

  console.log(`Garage openTime: ${garage.openTime}`);
  console.log(`Garage closeTime: ${garage.closeTime}`);

  // Create date objects for today's garage operating hours
  const appointmentDate = new Date(start);
  const appointmentDay = appointmentDate.toISOString().split("T")[0];
  console.log(`Appointment date: ${appointmentDay}`);

  const [garageOpenHour, garageOpenMinute] = garage.openTime.split(":").map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime.split(":").map(Number);
  console.log(`Parsed hours - Open: ${garageOpenHour}:${garageOpenMinute}, Close: ${garageCloseHour}:${garageCloseMinute}`);

  // Create proper UTC times for garage hours
  const garageOpenTime = new Date(appointmentDate);
  const garageCloseTime = new Date(appointmentDate);

  // Set hours directly to UTC values (no conversion needed)
  garageOpenTime.setUTCHours(garageOpenHour, garageOpenMinute, 0, 0);
  garageCloseTime.setUTCHours(garageCloseHour, garageCloseMinute, 0, 0);

  // Check if appointment is within garage's operating hours
  console.log(`Comparison: ${start.toISOString()} < ${garageOpenTime.toISOString()} = ${start < garageOpenTime}`);

  if (start < garageOpenTime) {
    console.log("Appointment starts before garage opens!");
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`
    };
  }

  console.log(`Comparison: ${end.toISOString()} > ${garageCloseTime.toISOString()} = ${end > garageCloseTime}`);

  if (end > garageCloseTime) {
    console.log("Appointment ends after garage closes!");
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
    console.log("Vehicle already has an appointment during this time!");

    // Get the garage name for the conflicting appointment
    const conflictGarage = await Garage.findById(overlappingAppointments[0].garage);
    const garageName = conflictGarage ? conflictGarage.name : "another garage";

    return {
      hasConflict: true,
      conflictMessage: `Vehicle is already scheduled at ${garageName} during this time`
    };
  }

  console.log("=== END: checkBooking ===");
  return { hasConflict: false };
};

const convertAndValidateDateTime = async (start, serviceIds) => {
  console.log("=== START: convertAndValidateDateTime ===");
  console.log(`Input start time:`, start);
  console.log(`Service IDs:`, serviceIds);

  try {
    // Get current time in UTC
    const nowUtc = new Date();
    console.log(`Current UTC time: ${nowUtc.toISOString()}`);

    // Add UTC+7 offset to account for Vietnam timezone
    const vietnamOffset = 7 * 60 * 60 * 1000; // 7 hours in milliseconds
    const nowVietnam = new Date(nowUtc.getTime() + vietnamOffset);
    console.log(`Current Vietnam time (UTC+7): ${nowVietnam.toISOString()}`);

    // Convert start to Date if it's a string
    const startTime = typeof start === 'string' ? new Date(start) : start;

    // Check if startTime is a valid date
    if (isNaN(startTime.getTime())) {
      console.log("ERROR: Invalid date format");
      throw new Error("Invalid date format. Please provide a valid date and time.");
    }

    console.log(`Parsed start time: ${startTime.toISOString()}`);

    // FUTURE TIME VALIDATION - compare with Vietnam time
    console.log(`Is start time in future? ${startTime > nowVietnam}`);
    if (startTime <= nowVietnam) {
      console.log("ERROR: Start time must be in the future");
      throw new Error("Appointment time must be in the future");
    }

    // Calculate service duration
    let totalDurationMinutes = 0;
    console.log("Calculating total duration from services:");

    for (const serviceId of serviceIds) {
      console.log(`Processing service ID: ${serviceId}`);
      const serviceDetail = await ServiceDetail.findById(serviceId);

      if (!serviceDetail) {
        console.log(`ERROR: Service with ID ${serviceId} not found`);
        throw new Error(`Service with ID ${serviceId} not found`);
      }

      console.log(`Service name: ${serviceDetail.name}`);
      console.log(`Raw duration string: "${serviceDetail.duration}"`);

      // Parse duration from various formats
      const durationStr = serviceDetail.duration;
      let minutes = 0;

      if (durationStr.includes('hour')) {
        const hours = parseFloat(durationStr.split(' ')[0]);
        minutes = hours * 60;
        console.log(`Parsed as hours: ${hours} hours = ${minutes} minutes`);
      } else if (durationStr.includes('minute')) {
        minutes = parseInt(durationStr.split(' ')[0]);
        console.log(`Parsed as minutes: ${minutes} minutes`);
      } else if (durationStr.includes(':')) {
        const [first, second] = durationStr.split(':').map(Number);
        console.log(`Parsed time format: ${first}:${second}`);

        if (second === 0) {
          minutes = first;
          console.log(`Treated as direct minutes: ${minutes} minutes`);
        } else if (first < 24 && second < 60) {
          minutes = first * 60 + second;
          console.log(`Treated as hours:minutes: ${minutes} minutes`);
        } else {
          minutes = 60; // Default fallback
          console.log(`Invalid format, using default: ${minutes} minutes`);
        }
      } else if (!isNaN(parseInt(durationStr))) {
        minutes = parseInt(durationStr);
        console.log(`Parsed as number: ${minutes} minutes`);
      } else {
        minutes = 60; // Default fallback
        console.log(`Unrecognized format, using default: ${minutes} minutes`);
      }

      totalDurationMinutes += minutes;
      console.log(`Running total duration: ${totalDurationMinutes} minutes`);
    }

    console.log(`Final total duration: ${totalDurationMinutes} minutes`);

    // Calculate end time by adding total duration
    const endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);
    console.log(`Calculated end time: ${endTime.toISOString()}`);

    const result = {
      startTime,
      endTime,
      isValid: true,
      error: null,
    };

    console.log(`Returning result:`, result);
    console.log("=== END: convertAndValidateDateTime ===");
    return result;
  } catch (error) {
    console.log(`ERROR in convertAndValidateDateTime: ${error.message}`);
    console.log(error.stack);

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
  const vehicleInfo = await Vehicle.findById(vehicle).select('carBrand carName carPlate');

  // Format dates for display
  const displayDate = validatedStartTime.toLocaleDateString('vi-VN');
  const displayStartTime = validatedStartTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  const displayEndTime = endTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});

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
  // // Send notification to garage owners
  // const garageOwners = await User.find({ garageList: garage });
  // if (garageOwners && garageOwners.length > 0) {
  //   for (const owner of garageOwners) {
  //     await transporter.sendMail({
  //       from: process.env.MAIL_USER,
  //       to: owner.email,
  //       subject: "Thông báo lịch hẹn mới",
  //       html: `
  //         <h2>Xin chào ${owner.name},</h2>
  //         <p>Garage của bạn vừa nhận được một lịch hẹn mới.</p>
  //         <h3>Chi tiết lịch hẹn:</h3>
  //         <ul>
  //           <li><strong>Khách hàng:</strong> ${user.name}</li>
  //           <li><strong>Số điện thoại:</strong> ${user.phone || 'Không có'}</li>
  //           <li><strong>Xe:</strong> ${vehicleInfo ? `${vehicleInfo.carBrand} ${vehicleInfo.carName} (${vehicleInfo.carPlate})` : 'Không có thông tin xe'}</li>
  //           <li><strong>Ngày hẹn:</strong> ${displayDate}</li>
  //           <li><strong>Thời gian:</strong> ${displayStartTime} - ${displayEndTime}</li>
  //           <li><strong>Ghi chú:</strong> ${note || 'Không có'}</li>
  //         </ul>
  //         <p>Xem chi tiết lịch hẹn <a href="http://localhost:${process.env.PORT}/api/appointment/${newAppointment._id}">tại đây</a>.</p>
  //         <p>Vui lòng kiểm tra và xác nhận lịch hẹn càng sớm càng tốt.</p>
  //       `
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
<p>Lịch hẹn của bạn đã được hủy <span style="color: #28a745; font-weight: bold;">thành công</span>.</p>  
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
  // Validate update data
  const validation = updateAppointmentValidate(updateData);
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
  let serviceIds = appointment.service;

  // If updating start time or services, recalculate end time
  if (updateData.start || updateData.service) {
    if (updateData.service) {
      serviceIds = updateData.service;
    }

    const newStartTime = updateData.start ?
        (typeof updateData.start === 'string' ? new Date(updateData.start) : updateData.start) :
        oldStart;

    const validationResult = await convertAndValidateDateTime(newStartTime, serviceIds);
    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    startTime = validationResult.startTime;
    endTime = validationResult.endTime;

    // Check for booking conflicts
    const bookingCheck = await checkBooking(
        updateData.vehicle || appointment.vehicle,
        updateData.garage || appointment.garage,
        startTime,
        endTime,
        appointmentId
    );

    if (bookingCheck.hasConflict) {
      throw new Error(bookingCheck.conflictMessage || "Booking conflict detected");
    }
  }

  // Update the appointment with new data
  const updatedFields = {
    ...updateData,
    start: startTime,
    end: endTime
  };

  const updatedAppointment = await Appointment.findByIdAndUpdate(
      appointmentId,
      { $set: updatedFields },
      { new: true, runValidators: true }
  );

  // Send email notification about the update
  const user = await User.findById(userId);
  const garageInfo = await Garage.findById(updatedAppointment.garage).select('name address');

  // Format dates for email
  const oldDisplayDate = oldStart.toLocaleDateString('vi-VN');
  const oldDisplayStartTime = oldStart.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  const oldDisplayEndTime = oldEnd.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});

  const newDisplayDate = startTime.toLocaleDateString('vi-VN');
  const newDisplayStartTime = startTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});
  const newDisplayEndTime = endTime.toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'});

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