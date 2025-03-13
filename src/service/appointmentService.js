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