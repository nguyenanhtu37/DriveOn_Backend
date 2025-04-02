import { z } from "zod";
import mongoose from "mongoose";

// Schema cho ObjectId (chấp nhận string hoặc mongoose.Types.ObjectId)
const objectIdOrStringSchema = z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    z.instanceof(mongoose.Types.ObjectId),
]);




// Schema cho update appointment
const updateAppointmentSchema = z.object({
// Kiểm tra định dạng ngày YYYY-MM-DD
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD")
        .refine(val => !isNaN(Date.parse(val)), {
            message: "Invalid date format"
        }),

    // Kiểm tra định dạng thời gian HH:MM (24-hour format)
    start: z.string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in format HH:MM"),

    // Kiểm tra định dạng thời gian HH:MM (24-hour format)
    end: z.string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in format HH:MM"),

    note: z.string().optional(),
    vehicle: objectIdOrStringSchema.optional(),
    garage: objectIdOrStringSchema.optional(),
});

// Validation function for updating an appointment
export const updateAppointmentValidate = (appointmentData) => {
    try {
        // Validate input data with the defined schema
        updateAppointmentSchema.parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        // Return errors if validation fails
        return { valid: false, errors: e.errors };
    }
};
// Cập nhật appointmentSchema để bao gồm date, start và end
const appointmentSchema = z.object({
    user: z.string().nonempty("User ID is required"), // User ID
    garage: z.string().nonempty("Garage ID is required"), // Garage ID
    service: z.array(z.string().nonempty("Service ID is required")).nonempty("At least one service is required"), // Required services
    vehicle: z.string().nonempty("Vehicle ID is required"), // Vehicle ID

    // Kiểm tra định dạng ngày YYYY-MM-DD
    date: z.string()
        .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in format YYYY-MM-DD")
        .refine(val => !isNaN(Date.parse(val)), {
            message: "Invalid date format"
        }),

    // Kiểm tra định dạng thời gian HH:MM (24-hour format)
    start: z.string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Start time must be in format HH:MM"),

    // Kiểm tra định dạng thời gian HH:MM (24-hour format)
    end: z.string()
        .regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "End time must be in format HH:MM"),

    status: z.enum(["Pending", "Accepted", "Rejected", "Completed", "Cancelled"]).default("Pending"), // Status
    tag: z.enum(["Normal", "Emergency"]).default("Normal"), // Tag (condition)
    note: z.string().optional(), // Note (optional)
});

// Validation function for creating an appointment
export const createAppointmentValidate = (appointmentData) => {
    try {
        // Validate input data with the defined schema
        appointmentSchema.parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        // Return errors if validation fails
        return { valid: false, errors: e.errors };
    }
};