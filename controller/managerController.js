import Garage from "../models/garage.js";

const registerGarage = async (req, res) => {
  const user = req.user;
  console.log("User information:", user);
  const { name, address, phone, description, workingHours, coinBalance } =
    req.body;
  try {
    // tao moi garage, default pending
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
    res.status(200).json({
      message: "Garage registration submitted successfully",
      garage: newGarage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

//
const viewGarages = async (req, res) => {
  try {
    const garages = await Garage.find({ user: req.user.id });
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGarageById = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    if (garage.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateGarage = async (req, res) => {
  const { id } = req.params;
  const {
    name,
    address,
    phone,
    description,
    workingHours,
    coinBalance,
    status,
  } = req.body;
  try {
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    if (garage.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
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
    res.status(200).json({ message: "Garage updated successfully", garage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteGarage = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await Garage.findById(id);
    if (!garage) {
      return res.status(404).json({ message: "Garage not found" });
    }

    if (garage.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    await garage.deleteOne();
    res.status(200).json({ message: "Garage deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  registerGarage,
  viewGarages,
  updateGarage,
  deleteGarage,
  getGarageById,
};
