import { z } from "zod";

const addServiceDetailSchema = z.object({
  service: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Service ID is not valid")
    .nonempty("Service is required"),
  garage: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, "Garage ID is not valid")
    .nonempty("Garage is required"),
  name: z.string().nonempty("Service detail name is required"),
  description: z.string().nonempty("Service detail description is required"),
  images: z
    .array(z.string().url("Each image URL must be a valid URL"))
    .nonempty("Service detail images must be an array with at least one image"),
  price: z
    .number()
    .optional()
    .refine((price) => price >= 0, {
      message: "Service detail price must be a positive number",
    }),
  duration: z
    .number()
    .optional()
    .refine((duration) => duration > 0, {
      message: "Service detail duration must be a positive number",
    }),
  warranty: z.string().optional(),
});

const updateServiceDetailSchema = addServiceDetailSchema.partial(); // Tất cả các trường đều là optional

export const validateAddServiceDetail = (serviceDetailData) => {
  try {
    addServiceDetailSchema.parse(serviceDetailData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};

export const validateUpdateServiceDetail = (serviceDetailData) => {
  try {
    updateServiceDetailSchema.parse(serviceDetailData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};
