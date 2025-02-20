import Service from "../models/service.js";
import { validateAddService, validateUpdateService } from "../validator/serviceValidator.js";

const addService = async (serviceData) => {
    // hàm validate chức năng add service
    validateAddService(serviceData);

  const { name, description, image } = serviceData;
  const newService = new Service({
    name,
    description,
    image,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newService.save();
  return newService;
};

const getAllServices = async () => {
  const services = await Service.find();
  return services;
};

const updateService = async (serviceId, updateData) => {
  // Validate update service
  validateUpdateService(updateData);

  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error("Service not found");
  }
  service.name = updateData.name || service.name;
  service.description = updateData.description || service.description;
  service.image = updateData.image || service.image;
  service.updatedAt = new Date();
  await service.save();
  return service;
};

const deleteService = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error("Service not found");
  }
  await service.deleteOne();
  return { message: "Service deleted successfully" };
};

export { addService, getAllServices, updateService, deleteService };

