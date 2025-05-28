import Service from "../models/service.js";
import {
  validateAddService,
  validateUpdateService,
} from "../validator/serviceValidator.js";

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
  const services = await Service.find({ isDeleted: false });
  const sortedServices = services.sort((a, b) => a.name.localeCompare(b.name));
  return sortedServices;
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

const escapeRegex = (text) => {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

const searchServiceByName = async (name, limit = 10) => {
  try {
    const safeName = escapeRegex(name);
    const services = await Service.find({
      name: { $regex: safeName, $options: "i" },
    }).limit(limit);

    return services;
  } catch (error) {
    console.error("Error while searching for services:", error);
    throw new Error("Service search failed");
  }
};

const softDeleteService = async (serviceId) => {
  const service = await Service.findById(serviceId);
  if (!service) {
    throw new Error("Service not found");
  }
  service.isDeleted = true;
  service.updatedAt = new Date();
  await service.save();
  return { message: "Service soft deleted successfully" };
};

export {
  addService,
  getAllServices,
  updateService,
  deleteService,
  searchServiceByName,
  softDeleteService,
};
