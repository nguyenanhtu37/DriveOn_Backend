import { z } from "zod";



const appointmentSchema = z.object({
    user: z.string().nonempty("User ID is required"),
    garage: z.string().nonempty("Garage ID is required"),
    service: z.array(z.string().nonempty("Service ID is required")).nonempty("At least one service is required"),
    vehicle: z.string().nonempty("Vehicle ID is required"),
    date: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val);
        }
        return val; // Nếu đã là Date thì giữ nguyên
    }, z.date()),
    start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"),
    end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm"),

    status: z.enum(["Pending", "Accepted", "Rejected", "Completed", "Cancelled"]).default("Pending"),
    tag: z.enum(["Normal", "Emergency"]).default("Normal"),
    note: z.string().optional(),
});

// Validation function for creating an appointment
export const createAppointmentValidate = (appointmentData) => {
    try {
        appointmentSchema.parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};
export const updateAppointmentValidate = (appointmentData) => {
    try {
        appointmentSchema.partial().parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};

