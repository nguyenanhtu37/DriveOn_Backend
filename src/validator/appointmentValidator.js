import { z } from "zod";

// Function to validate start time
const validateStartTime = (start) => {
    const now = new Date();
    const [startHour, startMinute] = start.split(":").map(Number);
    const startDateTime = new Date();
    startDateTime.setHours(startHour, startMinute, 0, 0);
    return startDateTime > now;
};

// Function to validate end time
const validateEndTime = (end, ctx) => {
    const [endHour, endMinute] = end.split(":").map(Number);
    const endDateTime = new Date();
    endDateTime.setHours(endHour, endMinute, 0, 0);
    const startDateTime = new Date();
    const [startHour, startMinute] = ctx.parent.start.split(":").map(Number);
    startDateTime.setHours(startHour, startMinute, 0, 0);
    return endDateTime > startDateTime;
};

// Function to validate date - must be today or in the future
const validateDate = (date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to 00:00:00 of today
    return date >= today;
};

// Schema validation using Zod
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