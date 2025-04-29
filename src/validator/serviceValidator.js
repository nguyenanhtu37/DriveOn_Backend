import { z } from "zod";

const addServiceSchema = z.object({
  name: z.string().nonempty("Service name is required"),
  description: z.string().nonempty("Service description is required"),
  image: z
    .string()
    .url("Service image must be a valid URL")
    .nonempty("Service image is required"),
});

const updateServiceSchema = addServiceSchema.partial(); // Tất cả các trường đều là optional

export const validateAddService = (serviceData) => {
  try {
    addServiceSchema.parse(serviceData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};

export const validateUpdateService = (serviceData) => {
  try {
    updateServiceSchema.parse(serviceData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};