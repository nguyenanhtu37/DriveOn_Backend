import Garage from "../models/garage.js";

const registerGarage = async (user, garageData) => {
  const { name, address, phone, description, workingHours, coinBalance } = garageData;
  const newGarage = new Garage({
    name,
    address,
    phone,
    description,
    workingHours,
    coinBalance,
    user: [user.id],
    status: "pending",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newGarage.save();
  return newGarage;
};

const viewGarages = async (userId) => {
  const garages = await Garage.find({ user: userId });
  return garages;
};

const getGarageById = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

const updateGarage = async (userId, garageId, updateData) => {
  const { name, address, phone, description, workingHours, coinBalance, status } = updateData;
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
  garage.description = description || garage.description;
  garage.workingHours = workingHours || garage.workingHours;
  garage.coinBalance = coinBalance || garage.coinBalance;
  garage.status = status || garage.status;
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

export { registerGarage, viewGarages, getGarageById, updateGarage, deleteGarage, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration };