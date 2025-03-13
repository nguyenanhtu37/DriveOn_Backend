import Appointment from "../models/appointment.js";
import ServiceDetail from "../models/serviceDetail.js";
import Garage from "../models/garage.js";
import User from "../models/user.js";

export const createAppointmentService = async ({ userId, serviceDetailId, vehicleId, date, start, end, tag, note }) => {
    // Fetch garageId from ServiceDetail
    const serviceDetail = await ServiceDetail.findById(serviceDetailId);
    if (!serviceDetail) {
        throw new Error("Service Detail not found");
    }
    const garageId = serviceDetail.garage;

    const newAppointment = new Appointment({
        user: userId,
        garage: garageId,
        service: serviceDetailId,
        vehicle: vehicleId,
        date,
        start,
        end,
        status: "Pending", // Default status value
        tag,
        note,
    });
    await newAppointment.save();
    return newAppointment;
};

export const getAppointmentsByUserService = async (userId) => {
    return await Appointment.find({ user: userId })
        .populate('user', 'name email') // Select basic user information
        .populate('garage', 'name address') // Select basic garage information
        .populate('vehicle', 'carBrand carName carPlate') // Select basic vehicle information
        .populate('service'); // Populate service details
};
export const getAppointmentByIdService = async (appointmentId) => {
    return await Appointment.findById(appointmentId)
        .populate('user', 'name email') // Select basic user information
        .populate('garage', 'name address') // Select basic garage information
        .populate('vehicle', 'carBrand carName carPlate') // Select basic vehicle information
        .populate('service'); // Populate service details
};

export const getAppointmentsByGarageService = async (garageId) => {
    const garage = await Garage.findById(garageId);
    if (!garage) {
        throw new Error("Garage not found");
    }
    return await Appointment.find({ garage: garageId })
        .populate('user', 'name email') // Select basic user information
        .populate('garage', 'name address') // Select basic garage information
        .populate('vehicle', 'carBrand carName carPlate') // Select basic vehicle information
        .populate('service'); // Populate service details
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
        .populate('user', 'name email') // Select basic user information
        .populate('garage', 'name address') // Select basic garage information
        .populate('vehicle', 'carBrand carName carPlate') // Select basic vehicle information
        .populate('service'); // Populate service details
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