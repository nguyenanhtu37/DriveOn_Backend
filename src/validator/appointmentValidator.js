import { z } from "zod";

// Validate date format (YYYY-MM-DD)
const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date format. Use YYYY-MM-DD.");

// Validate time format (HH:mm)
const timeSchema = z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format. Use HH:mm.");

const appointmentSchema = z.object({
    user: z.string().nonempty("User ID is required"),
    garage: z.string().nonempty("Garage ID is required"),
    service: z.array(z.string().nonempty("Service ID is required")).nonempty("At least one service is required"),
    vehicle: z.string().nonempty("Vehicle ID is required"),
    date: z.preprocess((val) => {
        if (typeof val === "string") {
            return new Date(val); // Chuyển string thành Date object
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

// Schema validation for canceling an appointment (check appointmentId)
const cancelAppointmentSchema = z.object({
    appointmentId: z.string().min(1, { message: "Appointment ID is required" }), // Validate appointmentId is non-empty
});

// Validation function for canceling an appointment
export const validateCancelAppointment = (appointmentData) => {
    try {
        cancelAppointmentSchema.parse(appointmentData); // Only validate appointmentId
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};

// Schema validation for denying an appointment (check appointmentId)
const denyAppointmentSchema = z.object({
    appointmentId: z.string().min(1, { message: "Appointment ID is required" }), // Validate appointmentId is non-empty
});

// Validation function for denying an appointment
export const validateDenyAppointment = (appointmentData) => {
    try {
        denyAppointmentSchema.parse(appointmentData); // Only validate appointmentId
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};