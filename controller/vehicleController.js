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

export { addVehicle, viewVehicles, getVehicleById };