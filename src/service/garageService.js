import Garage from "../models/garage.js";
import User from "../models/user.js";
import { validateGarageRegistration, validateUpdateGarage } from "../validator/garageValidator.js";
const registerGarage = async (user, garageData) => {
  // Validate garageData
  validateGarageRegistration(garageData);
  const { name, address, phone, email, description, openTime, closeTime, operating_days, facadeImages, interiorImages, documentImages, } = garageData;
  const newGarage = new Garage({
    name,
    address,
    phone,
    email,
    description,
    openTime,
    closeTime,
    operating_days,
    facadeImages,
    interiorImages,
    documentImages,
    user: [user.id],
  });
  await newGarage.save();
  await User.findByIdAndUpdate(user.id, { $push: { garageList: newGarage._id } });
  return newGarage;
};

const viewGarages = async (userId) => {
  const garages = await Garage.find({ user: userId });
  console.log("userId: ", userId);
  return garages;
};

const getGarageById = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

// const updateGarage = async (userId, garageId, updateData) => {
//   const { name, address, phone, description, workingHours, coinBalance, status } = updateData;
//   const garage = await Garage.findById(garageId);
//   if (!garage) {
//     throw new Error("Garage not found");
//   }
//   if (garage.user.toString() !== userId) {
//     throw new Error("Unauthorized");
//   }
//   garage.name = name || garage.name;
//   garage.address = address || garage.address;
//   garage.phone = phone || garage.phone;
//   garage.description = description || garage.description;
//   garage.workingHours = workingHours || garage.workingHours;
//   garage.coinBalance = coinBalance || garage.coinBalance;
//   garage.status = status || garage.status;
//   garage.updatedAt = new Date();
//   await garage.save();
//   return garage;
// };

const updateGarage = async (userId, garageId, updateData) => {
  // Validate updateData
  validateUpdateGarage(updateData);
  const {
    name,
    address,
    phone,
    email,
    description,
    openTime,
    closeTime,
    operating_days,
    facadeImages,
    interiorImages,
    documentImages,
  } = updateData;

  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  if (garage.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  garage.name = name || garage.name;
  garage.address = address || garage.address;
  garage.phone = phone || garage.phone;
  garage.email = email || garage.email;
  garage.description = description || garage.description;
  garage.openTime = openTime || garage.openTime;
  garage.closeTime = closeTime || garage.closeTime;
  garage.operating_days = operating_days || garage.operating_days;
  garage.facadeImages = facadeImages || garage.facadeImages;
  garage.interiorImages = interiorImages || garage.interiorImages;
  garage.documentImages = documentImages || garage.documentImages;
  garage.updatedAt = new Date();

  await garage.save();
  return garage;
};

const deleteGarage = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  if (garage.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }
  await garage.deleteOne();
  return { message: "Garage deleted successfully" };
};

const viewGarageRegistrations = async () => {
  try {
    const garages = await Garage.find({ status: 'pending' }).populate('user', 'email name phone');
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getGarageRegistrationById = async (garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

const approveGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = 'approved';
    await garage.save();

    return { message: "Garage registration approved successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

const rejectGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = 'rejected';
    await garage.save();

    return { message: "Garage registration rejected successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

export { registerGarage, viewGarages, getGarageById, updateGarage, deleteGarage, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, getGarageRegistrationById };