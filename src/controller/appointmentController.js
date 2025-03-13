import * as appointmentService from "../service/appointmentService.js";
import ServiceDetail from "../models/serviceDetail.js";

export const createAppointment = async (req, res) => {
    const userId = req.user.id;
    const { serviceDetailId } = req.params; // Lấy từ URL
    const { vehicleId, date, start, end, note } = req.body;

    try {
        // 📌 Lấy garageId từ ServiceDetail
        const serviceDetail = await ServiceDetail.findById(serviceDetailId);
        if (!serviceDetail) {
            return res.status(404).json({ error: "Service Detail not found" });
        }
        const garageId = serviceDetail.garage;

        // 📌 Tạo appointment
        const appointment = await appointmentService.createAppointmentService({
            userId,
            garageId,
            serviceDetailId,
            vehicleId,
            date,
            status: "Pending",
            start,
            end,
            tag: "Normal",
            note: note || "",
        });

        res.status(201).json(appointment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
