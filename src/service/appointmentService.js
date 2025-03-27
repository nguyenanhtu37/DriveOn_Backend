import Appointment from "../models/appointment.js";
import ServiceDetail from "../models/serviceDetail.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";
import { createAppointmentValidate } from "../validator/appointmentValidator.js";

// Add this helper function to appointmentService.js
const checkVehicleDoubleBooking = async (vehicleId, garageId, date, start, end, currentAppointmentId = null) => {
  // Convert appointment times to Date objects for comparison
  const appointmentDate = new Date(date);
  const [startHour, startMinute] = start.split(":").map(Number);
  const [endHour, endMinute] = end.split(":").map(Number);

  const startTime = new Date(appointmentDate);
  startTime.setHours(startHour, startMinute, 0, 0);

  const endTime = new Date(appointmentDate);
  endTime.setHours(endHour, endMinute, 0, 0);

  // Find existing appointments for this vehicle on the same date
  const query = {
    vehicle: vehicleId,
    date: appointmentDate,
    status: { $nin: ["Rejected", "Cancelled"] }
  };

  // Exclude current appointment when updating
  if (currentAppointmentId) {
    query._id = { $ne: currentAppointmentId };
  }

  const existingAppointments = await Appointment.find(query);

  // Check for overlap with appointments at different garages
  for (const appointment of existingAppointments) {
    if (appointment.garage.toString() !== garageId.toString()) {
      const [apptStartHour, apptStartMinute] = appointment.start.split(":").map(Number);
      const [apptEndHour, apptEndMinute] = appointment.end.split(":").map(Number);

      const apptStartTime = new Date(appointmentDate);
      apptStartTime.setHours(apptStartHour, apptStartMinute, 0, 0);

      const apptEndTime = new Date(appointmentDate);
      apptEndTime.setHours(apptEndHour, apptEndMinute, 0, 0);

      // Check if times overlap
      if (startTime < apptEndTime && endTime > apptStartTime) {
        return {
          hasConflict: true,
          conflictGarage: appointment.garage
        };
      }
    }
  }

  return { hasConflict: false };
};

export const createAppointmentService = async ({
                                                 userId, garage, service, vehicle, date, start, end, tag, note,
                                               }) => {
  // Validate appointment data
  const { valid, errors } = createAppointmentValidate({
    user: userId,
    garage,
    service,
    vehicle,
    date: new Date(date), // Chuyển đổi date từ string sang Date object
    start,
    end,
    tag,
    note,
  });

  if (!valid) {
    console.error("Validation errors:", errors); // Log lỗi chi tiết
    const errorMessages = Array.isArray(errors) ? errors.map(error => error.message).join(", ") : "Validation failed";
    throw new Error(errorMessages);
  }

  // Check for double booking
  const bookingCheck = await checkVehicleDoubleBooking(vehicle, garage, date, start, end);
  if (bookingCheck.hasConflict) {
    throw new Error("This vehicle is already booked at another garage during this time period");
  }

  const newAppointment = new Appointment({
    user: userId,
    garage: garage,
    service: service,
    vehicle: vehicle,
    date,
    start,
    end,
    status: "Pending",
    tag,
    note,
  });
  await newAppointment.save();
  return newAppointment;
};
export const getAppointmentsByUserService = async (userId) => {
  return await Appointment.find({ user: userId })
    .populate("user", "name email") // Select basic user information
    .populate("garage", "name address") // Select basic garage information
    .populate("vehicle", "carBrand carName carPlate") // Select basic vehicle information
    .populate("service"); // Populate service details
};
export const getAppointmentByIdService = async (appointmentId) => {
  return await Appointment.findById(appointmentId)
    .populate("user", "name email") // Select basic user information
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
    .populate("user", "name email") // Select basic user information
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
    .populate("user", "name email") // Select basic user information
    .populate("garage", "name address") // Select basic garage information
    .populate("vehicle", "carBrand carName carPlate") // Select basic vehicle information
    .populate("service"); // Populate service details
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
  return appointment;
};

export const updateAppointmentService = async (
    appointmentId,
    userId,
    updateData
) => {
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

  // If updating time/date/garage, check for double booking
  if (updateData.date || updateData.start || updateData.end || updateData.garage) {
    const bookingCheck = await checkVehicleDoubleBooking(
        appointment.vehicle,
        updateData.garage || appointment.garage,
        updateData.date || appointment.date,
        updateData.start || appointment.start,
        updateData.end || appointment.end,
        appointmentId
    );

    if (bookingCheck.hasConflict) {
      throw new Error("This vehicle is already booked at another garage during this time period");
    }
  }

  Object.assign(appointment, updateData);
  await appointment.save();
  return appointment;
};