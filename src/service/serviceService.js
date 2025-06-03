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

const getAllServiceByManage = async ({
  page = 1,
  limit = 10,
  keyword = "",
}) => {
  try {
    // Convert string parameters to numbers
    page = parseInt(page) || 1;
    limit = parseInt(limit) || 10;

    // Create filter object
    const filter = { isDeleted: false };

    // Add name search if keyword exists
    if (keyword && keyword.trim() !== "") {
      filter.name = { $regex: escapeRegex(keyword), $options: "i" };
    }

    // Calculate skip for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination
    const totalCount = await Service.countDocuments(filter);

    // Get services with pagination
    const services = await Service.find(filter)
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit);

    // Calculate total pages
    const totalPages = Math.ceil(totalCount / limit);

    return {
      services,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (error) {
    console.error("Error fetching services:", error);
    throw new Error("Failed to fetch services");
  }
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
  getAllServiceByManage,
};
