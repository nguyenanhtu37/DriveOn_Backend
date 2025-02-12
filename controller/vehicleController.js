import * as vehicleService from '../service/vehicleService.js';

const addVehicle = async (req, res) => {
  const user = req.user;
  try {
    const newVehicle = await vehicleService.addVehicle(user, req.body);
    res.status(200).json({
      message: "Vehicle added successfully",
      vehicle: newVehicle,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const viewVehicles = async (req, res) => {
    try {
      const vehicles = await vehicleService.viewVehicles(req.user.id);
      res.status(200).json(vehicles);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };
const getVehicleById = async (req, res) => {
    const { id } = req.params;
    try {
      const vehicle = await vehicleService.getVehicleById(id);
      res.status(200).json(vehicle);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  };

const updateVehicle = async (req, res) => {
    const { id } = req.params;
    try {
      const updatedVehicle = await vehicleService.updateVehicle(req.user.id, id, req.body);
      res.status(200).json({ message: "Vehicle updated successfully", vehicle: updatedVehicle });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

const deleteVehicle = async (req, res) => {
    const { id } = req.params;
    try {
      const result = await vehicleService.deleteVehicle(req.user.id, id);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

export { addVehicle, viewVehicles, getVehicleById, updateVehicle, deleteVehicle };