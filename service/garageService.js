import Garage from "../models/garage.js";
import User from '../models/user.js';
import bcrypt from "bcrypt";



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
const addStaff = async (userId, garageId, staffData) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  const { name, email, phone, password } = staffData;
  const hashedPassword = await bcrypt.hash(password, 10);

  const staffRoleId = "67895c2e2e7333f925e9c0eb"; // Default staff role ID

  const newUser = new User({
    name,
    email,
    phone,
    password: hashedPassword,
    roles: [staffRoleId],
    garageList: [garageId],
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await newUser.save();
  return newUser;
};

const viewStaff = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  const staffList = await User.find({ garageList: garageId, roles: "67895c2e2e7333f925e9c0eb" });
  return staffList;
};
export { registerGarage, viewGarages, getGarageById, updateGarage, deleteGarage,addStaff,viewStaff };