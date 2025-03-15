import { z } from "zod";

// Lấy năm hiện tại
const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  carBrand: z.string().nonempty("Car brand is required"),
  carName: z.string().nonempty("Car name is required"),
  carYear: z.string().refine((year) => parseInt(year) < currentYear, {
    message: `Car year must be less than ${currentYear}`,
  }),
  carColor: z.string().nonempty("Car color is required"),
  carPlate: z.string().nonempty("Car plate is required"),
});

export const validateAddVehicle = (vehicleData) => {
  try {
    vehicleSchema.parse(vehicleData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};

export const validateUpdateVehicle = (vehicleData) => {
  const updateSchema = vehicleSchema.partial();
  try {
    updateSchema.parse(vehicleData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};