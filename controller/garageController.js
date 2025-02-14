import * as garageService from '../service/garageService.js';

const registerGarage = async (req, res) => {
  const user = req.user;
  try {
    const newGarage = await garageService.registerGarage(user, req.body);
    res.status(200).json({
      message: "Garage registration submitted successfully",
      garage: newGarage,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewGarages = async (req, res) => {
  try {
    const garages = await garageService.viewGarages(req.user.id);
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getGarageById = async (req, res) => {
  const { id } = req.params;
  try {
    const garage = await garageService.getGarageById(req.user.id, id);
    res.status(200).json(garage);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateGarage = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedGarage = await garageService.updateGarage(req.user.id, id, req.body);
    res.status(200).json({ message: "Garage updated successfully", garage: updatedGarage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteGarage = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await garageService.deleteGarage(req.user.id, id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewGarageRegistrations = async (req, res) => {
  try {
    const garages = await garageService.viewGarageRegistrations();
    res.status(200).json(garages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const approveGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const result = await garageService.approveGarageRegistration(garageId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const rejectGarageRegistration = async (req, res) => {
  try {
    const garageId = req.params.id;
    const result = await garageService.rejectGarageRegistration(garageId);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const addStaff = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const newStaff = await garageService.addStaff(req.user.id, id, req.body);
    res.status(201).json({
      message: "Staff added successfully",
      staff: newStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const viewStaff = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const staffList = await garageService.viewStaff(req.user.id, id);
    res.status(200).json(staffList);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const disableStaff = async (req, res) => {
  const { id } = req.params; // garage id
  const { staffId } = req.body;
  try {
    const updatedStaff = await garageService.disableStaff(req.user.id, id, staffId);
    res.status(200).json({
      message: "Staff disabled successfully",
      staff: updatedStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
const enableStaff = async (req, res) => {
  const { id } = req.params; // garage id
  const { staffId } = req.body;
  try {
    const updatedStaff = await garageService.enableStaff(req.user.id, id, staffId);
    res.status(200).json({
      message: "Staff enabled successfully",
      staff: updatedStaff,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export { registerGarage, viewGarages, updateGarage, deleteGarage, getGarageById, viewGarageRegistrations, approveGarageRegistration, rejectGarageRegistration, addStaff, viewStaff, disableStaff, enableStaff };