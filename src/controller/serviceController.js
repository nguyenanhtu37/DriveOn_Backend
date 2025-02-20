import * as serviceService from "../service/serviceService.js";

const addService = async (req, res) => {
  try {
    const newService = await serviceService.addService(req.body);
    res.status(201).json({
      message: "Service added successfully",
      service: newService,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getAllServices = async (req, res) => {
  try {
    const services = await serviceService.getAllServices();
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { addService, getAllServices };