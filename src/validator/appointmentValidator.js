import { z } from "zod";
import mongoose from "mongoose";

// Schema for ObjectId validation
const objectIdOrStringSchema = z.union([
    z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid ObjectId"),
    z.instanceof(mongoose.Types.ObjectId),
]);

// Array of service IDs
const serviceArraySchema = z.array(objectIdOrStringSchema).nonempty("At least one service is required");

// Schema for creating an appointment with the new structure
const createAppointmentSchema = z.object({
    garage: objectIdOrStringSchema,
    service: serviceArraySchema,
    vehicle: objectIdOrStringSchema,
    // Start time as ISO string or Date object
    start: z.union([
        z.string().datetime("Start time must be a valid ISO datetime string"),
        z.date()
    ]),
    tag: z.enum(["Normal", "Emergency"]).default("Normal"),
    note: z.string().optional(),
});

// Schema for updating an appointment with the new structure
const updateAppointmentSchema = z.object({
    garage: objectIdOrStringSchema.optional(),
    service: serviceArraySchema.optional(),
    vehicle: objectIdOrStringSchema.optional(),
    // Start time as ISO string or Date object
    start: z.union([
        z.string().datetime("Start time must be a valid ISO datetime string"),
        z.date()
    ]).optional(),
    tag: z.enum(["Normal", "Emergency"]).optional(),
    note: z.string().optional(),
});

// Validation function for creating an appointment
export const createAppointmentValidate = (appointmentData) => {
    try {
        createAppointmentSchema.parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};

// Validation function for updating an appointment
export const updateAppointmentValidate = (appointmentData) => {
    try {
        updateAppointmentSchema.parse(appointmentData);
        return { valid: true, errors: null };
    } catch (e) {
        return { valid: false, errors: e.errors };
    }
};