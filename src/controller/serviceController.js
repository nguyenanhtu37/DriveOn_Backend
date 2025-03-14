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

const updateService = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedService = await serviceService.updateService(id, req.body);
    res.status(200).json({
      message: "Service updated successfully",
      service: updatedService,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteService = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await serviceService.deleteService(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const searchServiceByName = async (req, res) => {
  try {
    const services = await serviceService.searchServiceByName(req.query.name, req.query.limit);
    res.status(200).json(services);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export { addService, getAllServices, updateService, deleteService, searchServiceByName };