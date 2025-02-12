import Garage from "../models/garage.js";

export const registerGarage = async (validatedData, userId) => {
  try {
    const newGarage = await Garage.create({
      ...validatedData,
      user: [userId],
    });

    return newGarage;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getGarages = async () => {
  try {
    const garages = await Garage.find().populate("user", "email name phone");

    return garages;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const getGarageById = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId).populate(
      "user",
      "email name phone"
    );
    if (!garage) {
      throw new Error("Garage not found");
    }
    return garage;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const approveGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = "approved";
    await garage.save();

    return garage;
  } catch (error) {
    throw new Error(error.message);
  }
};

export const rejectGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = "rejected";
    await garage.save();

    return garage;
  } catch (error) {
    throw new Error(error.message);
  }
};
