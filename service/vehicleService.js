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
  const vehicles = await Vehicle.find({ carOwner: userId });
  return vehicles;
};

export { addVehicle, viewVehicles };