import Garage from "../models/garage.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import {
  validateGarageRegistration,
  validateUpdateGarage,
} from "../validator/garageValidator.js";
import { validateSignup } from "../validator/authValidator.js";
import Role from "../models/role.js";
import Feedback from "../models/feedback.js";

const registerGarage = async (user, garageData) => {
  // Validate garageData
  validateGarageRegistration(garageData);
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
    status,
  } = garageData;
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
    status,
  });
  await newGarage.save();
  await User.findByIdAndUpdate(user.id, {
    $push: { garageList: newGarage._id },
  });
  return newGarage;
};

const viewGarages = async (userId) => {
  const garages = await Garage.find({ user: { $in: [userId] } });
  console.log("userId: ", userId);
  console.log("garages: ", garages);
  return garages;
};

const getGarageById = async (garageId) => {
  const garage = await Garage.findById(garageId).populate(
    "user",
    "name email phone"
  );
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};



const updateGarage = async (userId, garageId, updateData) => {
  // Validate updateData
  validateUpdateGarage(updateData);

  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  if (!garage.user.includes(userId)) {
    throw new Error("Unauthorized");
  }
  // Cập nhật các trường cho garage hahaa
  const fieldsToUpdate = [
    "name",
    "address",
    "phone",
    "email",
    "description",
    "openTime",
    "closeTime",
    "operating_days",
    "facadeImages",
    "interiorImages",
    "documentImages"
  ];
  fieldsToUpdate.forEach(field => {
    if (updateData[field] !== undefined) {
      garage[field] = updateData[field];
    }
  });

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
    const garages = await Garage.find({ status: "pending" }).populate(
      "user",
      "email name phone"
    );
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
    garage.status = ["enabled", "approved"];
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
    garage.status = "rejected";
    await garage.save();
    return { message: "Garage registration rejected successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

const addStaff = async (userId, garageId, staffData) => {
  try {
    // Validate staff data
    validateSignup(staffData);
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }
    const { name, email, phone, password } = staffData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = await Role.findOne({ roleName: "staff" });
    console.log("defaultRole: ", defaultRole._id);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      roles: [defaultRole._id],
      status: "active",
      garageList: garageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newUser.save();
    return newUser;
  } catch (err) {
    console.error("Error adding staff:", err.message);
    throw new Error(err.message);
  }
};

const viewStaff = async (userId, garageId) => {
  console.log("userId: ", userId);
  console.log("garageId: ", garageId);
  const garage = await Garage.findById(garageId);
  if (!garage.user.includes(userId)) {
    throw new Error("Unauthorized");
  }
  if (!garage) {
    throw new Error("Garage not found");
  }
  const staffList = await User.find({
    garageList: garageId,
    roles: "67b60df8c465fe4f943b98cc",
  });
  return staffList;
};

const viewGarageExisting = async () => {
  try {
    const garages = await Garage.find({ status: "enabled" });
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const disableStaff = async (userId, garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }
    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = "inactive";
    user.updatedAt = new Date();
    await user.save();
    return user;
  } catch (err) {
    console.error("Error disabling staff:", err.message);
    throw new Error(err.message);
  }
};

const enableStaff = async (userId, garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }
    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = "active";
    user.updatedAt = new Date();
    await user.save();
    return user;
  } catch (err) {
    console.error("Error enabling staff:", err.message);
    throw new Error(err.message);
  }
};

const getStaffById = async (garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    const staff = await User.findById(staffId);
    if (!staff || !staff.garageList.includes(garageId)) {
      throw new Error("Staff not found");
    }
    return staff;
  } catch (err) {
    console.error("Error getting staff by ID:", err.message);
    throw new Error(err.message);
  }
};

const enableGarage = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.status.includes("enabled")) {
      garage.status = garage.status.filter((status) => status !== "disabled");
      garage.status.push("enabled");
    }
    garage.updatedAt = new Date();
    await garage.save();
    return garage;
  } catch (err) {
    console.error("Error enabling garage:", err.message);
    throw new Error(err.message);
  }
};

const disableGarage = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.status.includes("disabled")) {
      garage.status = garage.status.filter((status) => status !== "enabled");
      garage.status.push("disabled");
    }
    garage.updatedAt = new Date();
    await garage.save();
    return garage;
  } catch (err) {
    console.error("Error disabling garage:", err.message);
    throw new Error(err.message);
  }
};

export const calculateAverageRating = async (garageId) => {
  const feedbacks = await Feedback.find({ garage: garageId });

  const averageRating =
    feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
      feedbacks.length || 0;
  return averageRating;
};

// export const filterGaragesByRating = async (minRating = 0) => {
//   try {
//     const garages = await Garage.find().select('name address phone email ratingAverage');
//     const filteredGarages = garages.filter(garage => garage.ratingAverage >= minRating);
//
//     // Sort garages by ratingAverage in descending order
//     filteredGarages.sort((a, b) => b.ratingAverage - a.ratingAverage);
//
//     return filteredGarages;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };
export const filterGaragesByRating = async (minRating = 0) => {
  try {
    const garages = await Garage.find().select(
      "name address phone email ratingAverage"
    );
    const filteredGarages = garages.filter(
      (garage) => garage.ratingAverage >= minRating
    );
    for (const garage of garages) {
      const averageRating = (await calculateAverageRating(garage._id)) || 0;
      garage.ratingAverage = averageRating;
      await garage.save();
    }
    filteredGarages.sort((a, b) => b.ratingAverage - a.ratingAverage);

    return filteredGarages;
  } catch (err) {
    throw new Error(err.message);
  }
};
export {
  registerGarage,
  viewGarages,
  getGarageById,
  updateGarage,
  deleteGarage,
  viewGarageRegistrations,
  approveGarageRegistration,
  rejectGarageRegistration,
  getGarageRegistrationById,
  addStaff,
  viewStaff,
  disableStaff,
  enableStaff,
  getStaffById,
  enableGarage,
  disableGarage,
  viewGarageExisting,
};
