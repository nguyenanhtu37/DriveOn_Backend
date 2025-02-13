import Vehicle from "../models/vehicle.js";

const addVehicle = async (user, vehicleData) => {
  const { carBrand, carName, carYear, carColor, carPlate } = vehicleData;
  const newVehicle = new Vehicle({
    carBrand,
    carName,
    carYear,
    carColor,
    carPlate,
    carOwner: user.id,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newVehicle.save();
  return newVehicle;
};

const viewVehicles = async (userId) => {
    const vehicles = await Vehicle.find({ carOwner: userId }).populate('carOwner');
    return vehicles;
};

const getVehicleById = async (vehicleId) => {
    const vehicle = await Vehicle.findById(vehicleId).populate('carOwner');
    if (!vehicle) {
      throw new Error("Vehicle not found");
    }
    return vehicle;
};

  const updateVehicle = async (userId, vehicleId, updateData) => {
    const { carBrand, carName, carYear, carColor, carPlate } = updateData;
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
    return { message: "Vehicle deleted successfully" };
  };
  
export { addVehicle, viewVehicles, getVehicleById, updateVehicle, deleteVehicle };