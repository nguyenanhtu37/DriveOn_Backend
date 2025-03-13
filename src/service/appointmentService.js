import Appointment from "../models/appointment.js";

export const createAppointmentService = async ({ userId, garageId, serviceDetailId, vehicleId, date, start, end, tag, note }) => {
    const newAppointment = new Appointment({
        user: userId,
        garage: garageId,
        service: serviceDetailId,
        vehicle: vehicleId,
        date,
        start,
        end,
        tag,
        note,
    });
    await newAppointment.save();
    return newAppointment;
};