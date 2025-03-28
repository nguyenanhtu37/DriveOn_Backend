import { z } from "zod";
import mongoose from "mongoose";

// Schema cho ObjectId (chấp nhận string hoặc mongoose.Types.ObjectId)
const objectIdOrStringSchema = z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    z.instanceof(mongoose.Types.ObjectId),
]);




// Schema cho update appointment
const updateAppointmentSchema = z.object({
    // date: z.union([z.string().refine((val) => !isNaN(Date.parse(val)), {
    //     message: "Invalid date format",
    // }), z.date()]).optional(),
    // start: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
    // end: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format").optional(),
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
const appointmentSchema = z.object({
    user: z.string().nonempty("User ID is required"), // User ID
    garage: z.string().nonempty("Garage ID is required"), // Garage ID
    service: z.array(z.string().nonempty("Service ID is required")).nonempty("At least one service is required"), // Required services
    vehicle: z.string().nonempty("Vehicle ID is required"), // Vehicle ID
    // date: z.date().refine(validateDate, { message: "Date must be today or in the future" }), // Date must be today or in the future
    // start: z.string().refine(validateStartTime, { message: "Start time must be in the future" }), // Start time must be in the future
    // end: z.string().refine(validateEndTime, { message: "End time must be after start time" }), // End time must be after start time

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