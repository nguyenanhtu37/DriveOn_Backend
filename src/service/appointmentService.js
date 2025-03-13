import Appointment from "../models/appointment.js";
import ServiceDetail from "../models/serviceDetail.js";

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
    return await Appointment.find({ user: userId }).populate('garage service vehicle');
};