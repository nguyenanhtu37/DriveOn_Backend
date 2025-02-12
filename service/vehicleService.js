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

export { addVehicle, viewVehicles, getVehicleById };