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

export { addService , getAllServices };

