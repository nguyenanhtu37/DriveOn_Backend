import Vehicle from "../models/vehicle.js";
import User from "../models/user.js";
import { validateAddVehicle, validateUpdateVehicle } from "../validator/vehicleValidator.js";

const addVehicle = async (user, vehicleData) => {
  // hàm validate dữ liệu
  validateAddVehicle(vehicleData);
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
  // Lưu vô Vehicle chưa đồng nghĩa là bên User cũng có nha. 
  // Phải có dòng ni thì hắn mới update thuộc tính vehicles bên đó chứ @KhangNV?
  await User.findByIdAndUpdate(user.id, { $push: { vehicles: newVehicle._id } });
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
    // validate update data
    validateUpdateVehicle(updateData);
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
    // Xóa vehicleId trong mảng vehicles của User luôn nhé @KhangNV ơi :))
    // Ko có hàng ni thì chỉ xóa trong Vehicle thôi, User ko bị ảnh hưởng
    await User.findByIdAndUpdate(userId, { $pull: { vehicles: vehicleId } });
    return { message: "Vehicle deleted successfully" };
  };
  
export { addVehicle, viewVehicles, getVehicleById, updateVehicle, deleteVehicle };