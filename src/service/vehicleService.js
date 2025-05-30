import Vehicle from "../models/vehicle.js";
import User from "../models/user.js";
import {
  validateAddVehicle,
  validateUpdateVehicle,
} from "../validator/vehicleValidator.js";
import Brand from "../models/brand.js";

const addVehicle = async (user, vehicleData) => {
  // Validate dữ liệu
  validateAddVehicle(vehicleData);

  // Kiểm tra sự tồn tại của carBrand
  const brandExists = await Brand.exists({ _id: vehicleData.carBrand });
  if (!brandExists) {
    throw new Error("Car brand not found");
  }

  const { carBrand, carName, carYear, carColor, carPlate, carImages } =
    vehicleData;
  const newVehicle = new Vehicle({
    carBrand,
    carName,
    carYear,
    carColor,
    carPlate,
    carImages, // Thêm carImages
    carOwner: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newVehicle.save();
  await User.findByIdAndUpdate(user.id, {
    $push: { vehicles: newVehicle._id },
  });
  return newVehicle;
};

const viewVehicles = async (userId) => {
  const vehicles = await Vehicle.find({
    carOwner: userId,
    isDeleted: false,
  })
    .populate("carOwner")
    .populate("carBrand", "brandName")
    .select(" carName carYear carColor carPlate carImages");
  return vehicles;
};

const getVehicleById = async (vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId)
    .populate("carOwner")
    .select("carBrand carName carYear carColor carPlate carImages");
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }
  return vehicle;
};

const updateVehicle = async (userId, vehicleId, updateData) => {
  // Validate update data
  validateUpdateVehicle(updateData);

  if (updateData.carBrand) {
    const brandExists = await Brand.exists({ _id: updateData.carBrand });
    if (!brandExists) {
      throw new Error("Car brand not found");
    }
  }

  const { carBrand, carName, carYear, carColor, carPlate, carImages } =
    updateData;
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }
  if (vehicle.carOwner.toString() !== userId) {
    throw new Error("Unauthorized");
  }
  vehicle.carBrand = carBrand || vehicle.carBrand;
  vehicle.carName = carName || vehicle.carName;
  vehicle.carYear = carYear || vehicle.carYear;
  vehicle.carColor = carColor || vehicle.carColor;
  vehicle.carPlate = carPlate || vehicle.carPlate;
  vehicle.carImages = carImages || vehicle.carImages; // Cập nhật carImages
  vehicle.updatedAt = new Date();
  await vehicle.save();
  return vehicle;
};

const deleteVehicle = async (userId, vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }
  if (vehicle.carOwner.toString() !== userId) {
    throw new Error("Unauthorized");
  }
  await Vehicle.findByIdAndDelete(vehicleId);
  await User.findByIdAndUpdate(userId, { $pull: { vehicles: vehicleId } });
  return { message: "Vehicle deleted successfully" };
};

export const softDeleteVehicle = async (userId, vehicleId) => {
  const vehicle = await Vehicle.findById(vehicleId);
  if (!vehicle) {
    throw new Error("Vehicle not found");
  }

  if (vehicle.carOwner.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  vehicle.isDeleted = true;
  vehicle.updatedAt = new Date();
  await vehicle.save();

  return { message: "Vehicle soft deleted successfully" };
};

export {
  addVehicle,
  viewVehicles,
  getVehicleById,
  updateVehicle,
  deleteVehicle,
};
