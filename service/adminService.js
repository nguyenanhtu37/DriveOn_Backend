import Garage from '../models/garage.js';

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

const deleteGarage = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    await garage.deleteOne();
    return { message: "Garage deleted successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

export { viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, deleteGarage };