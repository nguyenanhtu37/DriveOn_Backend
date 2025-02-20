import Service from "../models/service.js";

const addService = async (serviceData) => {
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

export { addService, getAllServices, updateService };

