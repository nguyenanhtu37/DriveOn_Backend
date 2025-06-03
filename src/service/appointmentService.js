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
import { sendSocketEvent } from "../libs/socketEvent.js";

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
  const vietnamDate = new Date(start.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours
  const appointmentDay = daysOfWeek[vietnamDate.getUTCDay()];

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

  // Special handling for 24-hour garages
  const is24HourGarage =
    garageOpenHour === 0 &&
    garageOpenMinute === 0 &&
    garageCloseHour === 23 &&
    garageCloseMinute === 59;

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

  // Convert start time to Vietnam timezone for easier comparison
  const appointmentVietnamTime = new Date(start.getTime() + 7 * 60 * 60 * 1000); // Add 7 hours
  const appointmentHour = appointmentVietnamTime.getUTCHours();
  const appointmentMinute = appointmentVietnamTime.getUTCMinutes();

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

  // Only check opening time for the initial start time, not for split appointment end time
  if (!is24HourGarage && !isSplit && start < garageOpenTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage opens at ${garage.openTime}`,
    };
  }

  // Check closing time only for non-split appointments
  if (!is24HourGarage && !isSplit && start > garageCloseTime) {
    return {
      hasConflict: true,
      conflictMessage: `Garage closes at ${garage.closeTime}`,
    };
  }

  // For split appointments, we've already validated the times in convertAndValidateDateTime

  const overlappingAppointments = await Appointment.find({
    vehicle: vehicleId,
    garage: { $ne: garageId }, // chỉ check conflict ở garage khác
    _id: { $ne: currentAppointmentId },
    $or: [
      { start: { $lte: start }, end: { $gt: start } },
      { start: { $lt: end }, end: { $gte: end } },
      { start: { $gte: start }, end: { $lte: end } },
    ],
    status: { $nin: ["Cancelled", "Rejected", "Completed"] },
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

    // Convert to Vietnam time for day of week determination
    const vietnamDate = new Date(startTime.getTime() + 7 * 60 * 60 * 1000);
    const appointmentDay = daysOfWeek[vietnamDate.getUTCDay()];

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
    if (!garage.operating_days.includes(appointmentDay)) {
      throw new Error(`Garage is closed on ${appointmentDay}s`);
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

    // Check if it's a 24-hour garage
    const is24HourGarage =
      openHour === 0 &&
      openMinute === 0 &&
      closeHour === 23 &&
      closeMinute === 59;

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
    if (!is24HourGarage && startTime < garageOpenTime) {
      throw new Error(
        `Appointment only create within ${garage.openTime} to ${garage.closeTime}`
      );
    }

    if (!is24HourGarage && startTime > garageCloseTime) {
      throw new Error(
        `Appointment only create within ${garage.openTime} to ${garage.closeTime}`
      );
    }

    // 2. Calculate initial end time based on duration
    let endTime = new Date(startTime.getTime() + totalDurationMinutes * 60000);

    // 3. If end time exceeds closing time, handle split appointment
    if (!is24HourGarage && endTime > garageCloseTime) {
      // Minutes that can be completed on day 1
      const minutesBeforeClosing = Math.floor(
        (garageCloseTime - startTime) / 60000
      );

      // Remaining minutes to be scheduled on next operating day
      const remainingMinutes = totalDurationMinutes - minutesBeforeClosing;

      // Find the next operating day
      let currentDate = new Date(startTime);
      currentDate.setUTCDate(currentDate.getUTCDate() + 1); // Start with next day

      let daysToAdd = 1;
      let nextDayIndex;
      let maxIterations = 14; // Safety limit
      let iterationCount = 0;

      // Keep checking days until we find an operating day
      while (maxIterations > 0) {
        iterationCount++;
        const currentVietnamDate = new Date(
          currentDate.getTime() + 7 * 60 * 60 * 1000
        );
        nextDayIndex = currentVietnamDate.getUTCDay();
        const nextDayName = daysOfWeek[nextDayIndex];

        // Check if garage operates on this day
        if (garage.operating_days.includes(nextDayName)) {
          break; // Found next operating day
        }

        // Move to the next day
        currentDate.setUTCDate(currentDate.getUTCDate() + 1);
        daysToAdd++;
        maxIterations--;
      }

      if (maxIterations === 0) {
        throw new Error(
          "Could not find next operating day within reasonable timeframe"
        );
      }

      // Get the next operating day's opening time
      const nextDayOpenTime = new Date(startTime);
      nextDayOpenTime.setUTCDate(nextDayOpenTime.getUTCDate() + daysToAdd);
      nextDayOpenTime.setUTCHours(utcAdjustedOpenHour, utcOpenMinute, 0, 0);

      // Calculate new end time: next day open time + remaining minutes
      endTime = new Date(nextDayOpenTime.getTime() + remainingMinutes * 60000);

      // Format display info for continuation details
      const nextDayVietnamTime = new Date(
        nextDayOpenTime.getTime() + 7 * 60 * 60 * 1000
      );
      const nextDayDisplay = nextDayVietnamTime.toLocaleDateString("vi-VN");
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

  sendSocketEvent("newAppointment", garage, garage);

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
    // Get user information
    const customer = await User.findById(userId);
    if (!customer) {
      console.error("User not found for email notification");
      return;
    }

    // Get garage information
    const garage = await Garage.findById(garageId);
    if (!garage) {
      console.error("Garage not found for email notification");
      return;
    }

    // Get vehicle information
    const vehicle = await Vehicle.findById(vehicleId).populate("carOwner");
    if (!vehicle) {
      console.error("Vehicle not found for email notification");
      return;
    }

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = start.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const displayStartTime = start.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const displayEndTime = end.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send confirmation email to customer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: "Appointment Confirmation",
      html: `
        <h2>Hello ${customer.name},</h2>
        <p>Your appointment has been <span style="color: #28a745; font-weight: bold;">successfully booked</span> and is pending confirmation.</p>
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Location:</strong> ${garage.address}</li>
          <li><strong>Vehicle:</strong> ${vehicle.carName} (${
        vehicle.carPlate
      })</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime} </li>
          <li><strong>Note:</strong> ${note || "None"}</li>
        </ul>
        <p>You can view your appointment details <a href="${
          process.env.FRONTEND_URL
        }/profile">here</a>.</p>
        <p>Thank you for choosing our service!</p>
      `,
    });

    // Find garage managers to notify them
    const managerRole = await Role.findOne({ roleName: "manager" });
    if (!managerRole) {
      console.error("Manager role not found for notification");
      return;
    }

    // Find managers associated with this garage (in garage.user array)
    const managers = await User.find({
      _id: { $in: garage.user },
      roles: managerRole._id,
    });

    if (managers.length === 0) {
      console.error("No managers found for notification");
      return;
    }

    // Send notification to each manager
    for (const manager of managers) {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: manager.email,
        subject: "New Appointment Request",
        html: `
          <h2>Hello ${manager.name},</h2>
          <p>A new appointment has been booked at your garage.</p>
          <h3>Appointment Details:</h3>
          <ul>
            <li><strong>Customer:</strong> ${customer.name} (${
          customer.email
        })</li>
            <li><strong>Vehicle:</strong> ${vehicle.carName} (${
          vehicle.carPlate
        })</li>
            <li><strong>Date:</strong> ${displayDate}</li>
            <li><strong>Time:</strong> ${displayStartTime} </li>
            <li><strong>Note:</strong> ${note || "None"}</li>
          </ul>
          <p>Please <a href="${process.env.FRONTEND_URL}/garageManagement/${
          garage._id
        }/appointments">confirm or deny</a> this appointment request as soon as possible.</p>
        `,
      });
    }
  } catch (error) {
    console.error("Error sending appointment emails:", error.message);
  }
}

// No change needed to the main createAppointmentService function as it just calls sendAppointmentEmails

export const getAppointmentsByUserService = async (
  userId,
  page = 1,
  limit = 10,
  status,
  keyword
) => {
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const query = { user: userId };

  if (status === "Upcoming") {
    query.status = { $in: ["Pending", "Accepted"] };
    query.start = { $gte: new Date() }; // Only future appointments
  } else if (status !== "All") {
    const statusList = status.split(",").map((s) => s.trim());
    query.status = { $in: statusList };
  }

  // Add keyword search capability
  if (keyword && keyword.trim() !== "") {
    const searchRegex = new RegExp(keyword.trim(), "i");

    // First, populate and find appointments
    const allAppointments = await Appointment.find(query)
      .populate("garage", "name address")
      .populate("vehicle", "carName carPlate")
      .populate("service", "name")
      .lean();

    // Filter appointments that match the keyword in various fields
    const filteredAppointmentIds = allAppointments
      .filter(
        (appointment) =>
          // Search in note field
          (appointment.note && searchRegex.test(appointment.note)) ||
          // Search in garage name/address
          (appointment.garage &&
            (searchRegex.test(appointment.garage.name) ||
              searchRegex.test(appointment.garage.address))) ||
          // Search in vehicle info
          (appointment.vehicle &&
            (searchRegex.test(appointment.vehicle.carName) ||
              searchRegex.test(appointment.vehicle.carPlate))) ||
          // Search in service names
          (appointment.service &&
            appointment.service.some((s) => searchRegex.test(s.name)))
      )
      .map((appointment) => appointment._id);

    query._id = { $in: filteredAppointmentIds };
  }

  const skip = (page - 1) * limit;

  const totalCount = await Appointment.countDocuments(query);

  const appointments = await Appointment.find(query)
    .populate("user", "name email")
    .populate("garage", "name address")
    .populate("vehicle", "carBrand carName carPlate")
    .populate("service", "")
    .sort({ start: 1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  return {
    appointments,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const getAppointmentByIdService = async (appointmentId) => {
  return await Appointment.findById(appointmentId)
    .populate("user", "avatar name email locale phone") // Select basic user information
    .populate("garage", "name address") // Select basic garage information
    .populate({
      path: "vehicle",
      select: "carBrand carName carPlate carImages ",
      populate: {
        path: "carBrand",
        select: "brandName logo",
      },
    }) // Populate vehicle with nested carBrand
    .populate("service") // Populate service details
    .populate("assignedStaff", "name avatar"); // Add staff information
};

export const getAppointmentsByVehicleService = async (
  vehicleId,
  userId,
  page = 1,
  limit = 10
) => {
  // Validate page and limit parameters
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  // Check if the vehicle exists
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (vehicle.carOwner.toString() !== userId) {
    throw new Error("Unauthorized - Vehicle doesn't belong to this user");
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Get total count for pagination metadata
  const totalCount = await Appointment.countDocuments({
    vehicle: vehicleId,
    status: "Completed", // Only count completed appointments
  });

  // Find only completed appointments for this vehicle with pagination
  const appointments = await Appointment.find({
    vehicle: vehicleId,
    status: "Completed", // Only return completed appointments
  })
    .populate("user", "name email avatar")
    .populate("garage", "name address")
    .populate({
      path: "vehicle",
      select: "carBrand carName carPlate",
      populate: {
        path: "carBrand",
        select: "brandName logo",
      },
    })
    .populate("service", "name price duration")
    .populate("assignedStaff", "name avatar");
  //   .skip(skip)
  //   .limit(limit);

  // // Calculate pagination metadata
  // const totalPages = Math.ceil(totalCount / limit);

  return appointments;
};
export const getAppointmentsByGarageService = async (
  garageId,
  page = 1,
  limit = 10,
  startDate,
  endDate,
  status
) => {
  // Validate page and limit parameters
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Build query filters
  const query = { garage: garageId };

  // Add date range filters if provided
  if (startDate || endDate) {
    query.start = {};
    if (startDate) {
      query.start.$gte = new Date(startDate);
    }
    if (endDate) {
      query.start.$lte = new Date(endDate);
    }
  }

  // Add status filter if provided
  if (status && status !== "all") {
    // Support comma-separated status values
    const statusList = status.split(",").map((s) => s.trim());
    query.status = { $in: statusList };
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Get total count for pagination metadata using the same query
  const totalCount = await Appointment.countDocuments(query);

  // Get paginated and filtered appointments
  const appointments = await Appointment.find(query)
    .populate("user", "name email avatar address")
    .populate("garage", "name address")
    .populate("vehicle", "carBrand carName carPlate")
    .populate("service")
    .sort({ start: -1 }) // Sort by start date, newest first
    .skip(skip)
    .limit(limit);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);

  return {
    appointments,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const confirmAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Find the garage to check authorization
  const garage = await Garage.findById(appointment.garage);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if user is authorized (is in garage.user or garage.staffs array)
  if (!garage.user.includes(userId) && !garage.staffs.includes(userId)) {
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
    // Get user information
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error("User not found for confirmation email");
      return;
    }

    // Get garage information
    const garage = await Garage.findById(garageId);
    if (!garage) {
      console.error("Garage not found for confirmation email");
      return;
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate("vehicle")
      .populate("service");
    if (!appointment) {
      console.error("Appointment not found for confirmation email");
      return;
    }

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send confirmation email to customer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: "Appointment Confirmed",
      html: `
        <h2>Hello ${customer.name},</h2>
        <p>Your appointment has been <span style="color: #28a745; font-weight: bold;">confirmed</span>!</p>
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Location:</strong> ${garage.address}</li>
          <li><strong>Vehicle:</strong> ${appointment.vehicle.carName} (${
        appointment.vehicle.carPlate
      })</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Note:</strong> ${appointment.note || "None"}</li>
        </ul>
        <p>You can view your appointment details <a href="${
          process.env.FRONTEND_URL
        }/profile">here</a>.</p>
        <p>Thank you for choosing our service!</p>
      `,
    });
  } catch (error) {
    console.error("Error sending confirmation email:", error.message);
  }
}

export const denyAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Find the garage to check authorization
  const garage = await Garage.findById(appointment.garage);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if user is authorized (is in garage.user or garage.staffs array)
  if (!garage.user.includes(userId) && !garage.staffs.includes(userId)) {
    throw new Error("Unauthorized");
  }

  appointment.status = "Rejected";
  await appointment.save();

  // Send rejection email asynchronously (fire and forget)
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
    // Get user information
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error("User not found for rejection email");
      return;
    }

    // Get garage information
    const garage = await Garage.findById(garageId);
    if (!garage) {
      console.error("Garage not found for rejection email");
      return;
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate("vehicle")
      .populate("service");
    if (!appointment) {
      console.error("Appointment not found for rejection email");
      return;
    }

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send rejection email to customer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: "Appointment Rejected",
      html: `
        <h2>Hello ${customer.name},</h2>
        <p>We regret to inform you that your appointment has been <span style="color: #dc3545; font-weight: bold;">rejected</span>.</p>
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Location:</strong> ${garage.address}</li>
          <li><strong>Vehicle:</strong> ${appointment.vehicle.carName} (${appointment.vehicle.carPlate})</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime}</li>
        </ul>
        <p>Please contact the garage directly for more information or to schedule a new appointment.</p>
        <p>Thank you for your understanding.</p>
      `,
    });
  } catch (error) {
    console.error("Error sending rejection email:", error.message);
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

  // Find the garage to check authorization
  const garage = await Garage.findById(appointment.garage);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if user is authorized (is in garage.user or garage.staffs array)
  if (!garage.user.includes(userId) && !garage.staffs.includes(userId)) {
    throw new Error("Unauthorized");
  }

  if (appointment.status !== "Accepted") {
    throw new Error("Only accepted appointments can be marked as completed");
  }

  // Update end time if provided
  if (updatedEndTime) {
    const endTime = new Date(updatedEndTime);
    if (isNaN(endTime.getTime())) {
      throw new Error("Invalid end time format");
    }
    appointment.end = endTime;
  }

  // Set next maintenance date if provided
  if (nextMaintenance) {
    const nextMaintenanceDate = new Date(nextMaintenance);
    if (isNaN(nextMaintenanceDate.getTime())) {
      throw new Error("Invalid next maintenance date format");
    }
    appointment.nextMaintenance = nextMaintenanceDate;
  }

  // Assign staff who completed the service
  appointment.assignedStaff = userId;
  appointment.status = "Completed";
  await appointment.save();

  // Send completion email asynchronously (fire and forget)
  sendCompletionEmail1(
    appointmentId,
    appointment.user,
    appointment.garage,
    appointment.start,
    appointment.end,
    userId,
    nextMaintenance
  ).catch((error) => console.error("Error sending completion email:", error));

  // Return immediately after saving
  return appointment;
};

// Separate function to handle email sending in background
async function sendCompletionEmail1(
  appointmentId,
  customerId,
  garageId,
  startTime,
  endTime,
  staffId,
  nextMaintenance
) {
  try {
    // Get user information
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error("User not found for completion email");
      return;
    }

    // Get garage information
    const garage = await Garage.findById(garageId);
    if (!garage) {
      console.error("Garage not found for completion email");
      return;
    }

    // Get staff information
    const staffInfo = await User.findById(staffId).select("name");
    if (!staffInfo) {
      console.error("Staff not found for completion email");
      return;
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate("vehicle")
      .populate("service");
    if (!appointment) {
      console.error("Appointment not found for completion email");
      return;
    }

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });
    const displayEndTime = endTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Format next maintenance date if provided
    let nextMaintenanceDisplay = "";
    if (nextMaintenance) {
      const nextMaintenanceDate = new Date(nextMaintenance);
      nextMaintenanceDisplay = nextMaintenanceDate.toLocaleDateString("vi-VN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }

    // Send completion email to customer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: "Service Completed",
      html: `
        <h2>Hello ${customer.name},</h2>
        <p>Your service has been <span style="color: #28a745; font-weight: bold;">completed</span>!</p>
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Location:</strong> ${garage.address}</li>
          <li><strong>Vehicle:</strong> ${appointment.vehicle.carName} (${
        appointment.vehicle.carPlate
      })</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Completed by:</strong> ${staffInfo.name}</li>
          ${
            nextMaintenanceDisplay
              ? `<li><strong>Next Recommended Maintenance:</strong> ${nextMaintenanceDisplay}</li>`
              : ""
          }
        </ul>
        <p>You can view your service history <a href="${
          process.env.FRONTEND_URL
        }/profile">here</a>.</p>
        <p>Thank you for choosing our service!</p>
      `,
    });
  } catch (error) {
    console.error("Error sending completion email:", error.message);
  }
}

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
    <h2>Hello ${carOwner.name},</h2>
    <p>Your next maintenance appointment has been successfully created by staff member <strong>${staff.name}</strong>.</p>
    <h3>Appointment Details:</h3>
    <ul>
      <li><strong>Garage:</strong> ${garage.name}</li>
      <li><strong>Address:</strong> ${garage.address}</li>
      <li><strong>Date:</strong> ${displayDate}</li>
      <li><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</li>
    </ul>
    <p>Please arrive on time for the best service experience.</p>
    <p>Thank you for using our services!</p>
  `;

    // Gửi email
    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: carOwner.email,
      subject: "Maintenance Appointment Confirmation - Created by Our Staff",
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

export const getAcceptedAppointmentsService = async (userId, garageId) => {
  // Find the garage to check authorization
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if user is authorized (is in garage.user or garage.staffs array)
  if (!garage.user.includes(userId) && !garage.staffs.includes(userId)) {
    throw new Error("Unauthorized");
  }

  return await Appointment.find({ status: "Accepted", garage: garageId })
    .populate("user", "name email avatar")
    .populate("garage", "name address")
    .populate("vehicle", "carBrand carName carPlate")
    .populate("service");
};

//Filter all type appointment
export const getFilteredAppointmentsService = async (
  filters = {},
  page = 1,
  limit = 10
) => {
  // Validate page and limit parameters
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  // Build query based on provided filters
  const query = {};

  // Add entity filters
  if (filters.userId) query.user = filters.userId;
  if (filters.garageId) query.garage = filters.garageId;
  if (filters.vehicleId) query.vehicle = filters.vehicleId;

  // // Add status filter
  // if (filters.status) {
  //   const statusList = filter.status.split(',');
  //   query.status = { $in: statusList };
  // }
  // Add status filter
  if (filters.status && filters.status !== "all") {
    // Chia theo dấu cách hoặc dấu phẩy
    const statusList = filters.status.split(/[\s,]+/);
    // Lọc những status nằm trong mảng
    query.status = { $in: statusList };
  }

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Get total count for pagination metadata
  const totalCount = await Appointment.countDocuments(query);

  // Get paginated appointments
  const appointments = await Appointment.find(query)
    .populate("user", "name email avatar address")
    .populate("garage", "name address")
    .populate({
      path: "vehicle",
      select: "carBrand carName carPlate",
      populate: {
        path: "carBrand",
        select: "brandName logo",
      },
    })
    .populate("service", "name price duration")
    .populate("assignedStaff", "name avatar")
    .sort({ start: -1 }) // Sort by appointment date, newest first
    .skip(skip)
    .limit(limit);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);

  return {
    appointments,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};

export const cancelAppointmentService = async (appointmentId, userId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // For car owner cancellations, we check if they own the appointment
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
    // Get user information
    const customer = await User.findById(customerId);
    if (!customer) {
      console.error("User not found for cancellation email");
      return;
    }

    // Get garage information
    const garage = await Garage.findById(garageId);
    if (!garage) {
      console.error("Garage not found for cancellation email");
      return;
    }

    // Get appointment details
    const appointment = await Appointment.findById(appointmentId)
      .populate("vehicle")
      .populate("service");
    if (!appointment) {
      console.error("Appointment not found for cancellation email");
      return;
    }

    // Format dates for email display in local time (Vietnam timezone)
    const displayDate = startTime.toLocaleDateString("vi-VN", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const displayStartTime = startTime.toLocaleTimeString("vi-VN", {
      hour: "2-digit",
      minute: "2-digit",
    });

    // Send cancellation email to customer
    await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: customer.email,
      subject: "Appointment Cancelled",
      html: `
        <h2>Appointment Cancellation Confirmation</h2>
        <p>Dear ${customer.name},</p>
        <p>Your appointment has been successfully cancelled:</p>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Address:</strong> ${garage.address}</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime}</li>
        </ul>
        <p>If you wish to reschedule, please visit our website or contact the garage directly.</p>
        <p>Thank you for using DriveOn services!</p>
      `,
    });

    // Notify garage staff/managers about the cancellation
    const managerRole = await Role.findOne({ roleName: "manager" });
    if (managerRole) {
      const managers = await User.find({
        _id: { $in: garage.user },
        roles: managerRole._id,
      });

      for (const manager of managers) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: manager.email,
          subject: "Appointment Cancellation Notification",
          html: `
            <h2>Appointment Cancelled</h2>
            <p>Dear ${manager.name},</p>
            <p>A customer has cancelled their appointment:</p>
            <ul>
              <li><strong>Customer:</strong> ${customer.name}</li>
              <li><strong>Date:</strong> ${displayDate}</li>
              <li><strong>Time:</strong> ${displayStartTime}</li>
              <li><strong>Vehicle:</strong> ${
                appointment.vehicle ? appointment.vehicle.carPlate : "N/A"
              }</li>
            </ul>
            <p>This time slot is now available for other bookings.</p>
          `,
        });
      }
    }
  } catch (error) {
    console.error("Error sending cancellation emails:", error.message);
  }
}

export const updateAppointmentByStaffService = async (
  appointmentId,
  staffId,
  updateData
) => {
  // Extract only allowed fields for staff updates
  const allowedUpdates = {
    service: updateData.service,
    note: updateData.note,
  };

  // Remove undefined fields
  Object.keys(allowedUpdates).forEach(
    (key) => allowedUpdates[key] === undefined && delete allowedUpdates[key]
  );

  // Check if there are any valid updates
  if (Object.keys(allowedUpdates).length === 0) {
    throw new Error("No valid fields to update");
  }

  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    throw new Error("Appointment not found");
  }

  // Find the garage to check authorization
  const garage = await Garage.findById(appointment.garage);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if staff is authorized (is in garage.user or garage.staffs array)
  if (!garage.user.includes(staffId) && !garage.staffs.includes(staffId)) {
    throw new Error("Unauthorized");
  }

  // Only allow updates to Pending or Accepted appointments
  if (appointment.status !== "Pending" && appointment.status !== "Accepted") {
    throw new Error("Only pending or accepted appointments can be updated");
  }

  // Build the update object
  const updateObj = {};

  if (allowedUpdates.note !== undefined) {
    updateObj.note = allowedUpdates.note;
  }

  // Recalculate end time if service is being updated
  if (allowedUpdates.service) {
    // Store old service for email notification
    const oldServiceIds = [...appointment.service];

    // Calculate new end time based on new services
    const validationResult = await convertAndValidateDateTime(
      appointment.start,
      allowedUpdates.service
    );

    if (!validationResult.isValid) {
      throw new Error(validationResult.error);
    }

    updateObj.service = allowedUpdates.service;
    updateObj.end = validationResult.endTime;
  }

  // Update appointment in the database
  const updatedAppointment = await Appointment.findByIdAndUpdate(
    appointmentId,
    updateObj,
    { new: true }
  )
    .populate("user", "name email")
    .populate("garage", "name address")
    .populate("service", "name duration price")
    .populate("vehicle", "carBrand carName carPlate");

  // Send email notification asynchronously
  sendServiceUpdateEmail(
    appointmentId,
    staffId,
    updatedAppointment,
    allowedUpdates.service !== undefined
  ).catch((error) =>
    console.error("Error sending service update notification:", error)
  );

  return updatedAppointment;
};

// Helper function to send notification emails
async function sendServiceUpdateEmail(
  appointmentId,
  staffId,
  appointment,
  serviceChanged
) {
  try {
    const staff = await User.findById(staffId);
    const customer = await User.findById(appointment.user._id);
    const garage = await Garage.findById(appointment.garage._id);

    if (!customer || !customer.email) return;

    // Format dates for display
    const displayDate = appointment.start.toLocaleDateString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const displayStartTime = appointment.start.toLocaleTimeString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    });

    const displayEndTime = appointment.end.toLocaleTimeString("en-US", {
      timeZone: "Asia/Ho_Chi_Minh",
      hour: "2-digit",
      minute: "2-digit",
    });

    // Format services for display
    const servicesList = appointment.service
      .map((s) => `${s.name} (VND:${s.price})`)
      .join(", ");

    let serviceUpdateText = "";
    if (serviceChanged) {
      serviceUpdateText = `<p><strong>Services have been updated</strong> for your appointment.</p>
                           <p>Updated services: ${servicesList}</p>`;
    }

    await transporter.sendMail({
      from: process.env.MAIL_USER,
      to: customer.email,
      subject: "Appointment Update Notification from Garage",
      html: `
        <h2>Hello ${customer.name},</h2>
        <p>Your appointment has been <span style="color: #007bff; font-weight: bold;">updated</span> by staff member ${
          staff.name
        }.</p>
        ${serviceUpdateText}
        <h3>Appointment Details:</h3>
        <ul>
          <li><strong>Garage:</strong> ${garage.name}</li>
          <li><strong>Address:</strong> ${garage.address}</li>
          <li><strong>Date:</strong> ${displayDate}</li>
          <li><strong>Time:</strong> ${displayStartTime} - ${displayEndTime}</li>
          <li><strong>Vehicle:</strong>  ${appointment.vehicle.carName} (${
        appointment.vehicle.carPlate
      })</li>
          <li><strong>Notes:</strong> ${appointment.note || "None"}</li>
        </ul>

        <p>If you have any questions, please contact the garage directly.</p>
        <p>View appointment details <a href="${
          process.env.FRONTEND_URL
        }/profile">here</a>.</p>
        <p>Thank you for using our services!</p>
      `,
    });
  } catch (error) {
    console.error("Error sending service update notification email:", error);
  }
}

export const isCalledAppointmentService = async (
  appointmentId,
  isUserAgreed
) => {
  try {
    const appointment = await Appointment.findById(appointmentId);
    appointment.isCalled = true;
    appointment.isUserAgreed = isUserAgreed;
    await appointment.save();
  } catch (error) {
    console.error("Error in update notification email process:", error);
  }
};

export const getAppointmentPercentsService = async () => {
  try {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    // Get all appointments for today
    const appointments = await Appointment.find({
      start: { $gte: startOfToday, $lte: endOfToday },
    });

    // Calculate percentages
    const totalAppointments = appointments.length;
    const completedAppointments = appointments.filter(
      (appointment) => appointment.status === "Completed"
    ).length;
    const cancelledAppointments = appointments.filter(
      (appointment) => appointment.status === "Cancelled"
    ).length;

    return {
      totalAppointments,
      completedAppointments,
      cancelledAppointments,
      completedPercentage:
        totalAppointments > 0
          ? ((completedAppointments / totalAppointments) * 100).toFixed(2)
          : 0,
      cancelledPercentage:
        totalAppointments > 0
          ? ((cancelledAppointments / totalAppointments) * 100).toFixed(2)
          : 0,
    };
  } catch (error) {
    console.error("Error in getAppointmentPercentsService:", error);
    throw error;
  }
};

// Set hourly appointment limit for a garage
export const setHourlyAppointmentLimitService = async (
  garageId,
  userId,
  limit
) => {
  // Check if the garage exists
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  // Check if user is authorized (is in garage.user array)
  if (!garage.user.includes(userId)) {
    throw new Error(
      "Unauthorized - Only garage managers can set appointment limits"
    );
  }

  // Validate the limit
  const hourlyLimit = parseInt(limit);
  if (isNaN(hourlyLimit) || hourlyLimit < 0) {
    throw new Error("Invalid limit value - must be a non-negative number");
  }

  // Update the garage with the new limit
  garage.hourlyAppointmentLimit = hourlyLimit;
  await garage.save();

  return garage;
};

// Get the hourly appointment limit for a garage
export const getHourlyAppointmentLimitService = async (garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  return { hourlyAppointmentLimit: garage.hourlyAppointmentLimit || 0 };
};

// Get all appointments in a specific 1-hour window for a garage
export const getAppointmentsInTimeRangeService = async (
  garageId,
  startDate,
  endDate,
  page = 1,
  limit = 10
) => {
  // Validate inputs
  if (!garageId) throw new Error("Garage ID is required");

  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime())) throw new Error("Invalid start date");
  if (isNaN(end.getTime())) throw new Error("Invalid end date");

  // Validate and parse pagination parameters
  page = parseInt(page);
  limit = parseInt(limit);
  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;

  // Calculate skip value for pagination
  const skip = (page - 1) * limit;

  // Query to find appointments in the specific time range for the garage
  const query = {
    garage: garageId,
    start: { $gte: start, $lt: end },
    status: { $in: ["Pending", "Accepted"] }, // Only count pending and accepted appointments
  };

  // Get total count for pagination metadata
  const totalCount = await Appointment.countDocuments(query);

  // Get paginated appointments
  const appointments = await Appointment.find(query)
    .populate("user", "name email avatar")
    .populate("garage", "name address")
    .populate({
      path: "vehicle",
      select: "carBrand carName carPlate",
      populate: {
        path: "carBrand",
        select: "name image",
      },
    })
    .populate("service", "name price duration")
    .sort({ start: 1 }) // Sort by start time ascending
    .skip(skip)
    .limit(limit);

  // Calculate pagination metadata
  const totalPages = Math.ceil(totalCount / limit);

  return {
    appointments,
    pagination: {
      currentPage: page,
      totalPages,
      pageSize: limit,
      totalCount,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
};
