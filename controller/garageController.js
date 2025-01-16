const garageService = require("../service/garageService");

const createGarage = async (req, res) => {
  try {
    const garage = await garageService.createGarage(req.body, req.user.id);
    res.status(201).json({ message: "Garage created successfully", garage });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

module.exports = {
  createGarage,
};
