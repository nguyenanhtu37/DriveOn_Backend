import * as appointmentService from "../service/appointmentService.js";

export const createAppointment = async (req, res) => {
    const userId = req.user.id;
    const { serviceDetailId } = req.params; // Extract from URL
    const { vehicleId, date, start, end, note } = req.body;

    try {
        // Create appointment
        const appointment = await appointmentService.createAppointmentService({
            userId,
            serviceDetailId,
            vehicleId,
            date,
            start,
            end,
            tag: "Normal", // Default tag value
            note: note || "", // Default note value if not provided
        });

        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

export const getAppointmentsByUser = async (req, res) => {
    const userId = req.user.id; // Get userId from token
    try {
        const appointments = await appointmentService.getAppointmentsByUserService(userId);
        res.status(200).json(appointments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};