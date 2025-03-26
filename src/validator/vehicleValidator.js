import { z } from "zod";

// Lấy năm hiện tại
const currentYear = new Date().getFullYear();

const vehicleSchema = z.object({
  carBrand: z.string().nonempty("Car brand is required"),
  carName: z.string().nonempty("Car name is required"),
  carYear: z.string().refine((year) => {
    const parsedYear = parseInt(year);
    return parsedYear > 1970 && parsedYear < currentYear;
  }, {
    message: `Car year must be a valid number and less than ${currentYear}`,
  }),
  carColor: z.string().nonempty("Car color is required"),
  carPlate: z.string().nonempty("Car plate is required"),
  carImages: z.array(z.string().url()).nonempty("At least one car image is required"),
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