import ServiceDetail from "../models/serviceDetail.js";
import { validateAddServiceDetail, validateUpdateServiceDetail } from "../validator/serviceDetailValidator.js";


const addServiceDetail = async (serviceDetailData) => {
  // Validate service detail data
  validateAddServiceDetail(serviceDetailData);

  const { service, garage, name, description, images, price, duration, warranty } = serviceDetailData;
  const newServiceDetail = new ServiceDetail({
    service,
    garage,
    name,
    description,
    images,
    price,
    duration,
    warranty,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newServiceDetail.save();
  return newServiceDetail;
};

const getServiceDetailsByGarage = async (garageId) => {
  const garageExists = await ServiceDetail.exists({ garage: garageId });
  if (!garageExists) {
      throw new Error("Garage not found");
  }
  const serviceDetails = await ServiceDetail.find({ garage: garageId }).populate("service").populate("garage");
  return serviceDetails;
};

const updateServiceDetail = async (serviceDetailId, updateData) => {
    // Validate update service detail
    validateUpdateServiceDetail(updateData);
  
    const serviceDetail = await ServiceDetail.findById(serviceDetailId);
    if (!serviceDetail) {
      throw new Error("Service detail not found");
    }
    serviceDetail.name = updateData.name || serviceDetail.name;
    serviceDetail.description = updateData.description || serviceDetail.description;
    serviceDetail.images = updateData.images || serviceDetail.images;
    serviceDetail.price = updateData.price || serviceDetail.price;
    serviceDetail.duration = updateData.duration || serviceDetail.duration;
    serviceDetail.warranty = updateData.warranty || serviceDetail.warranty;
    serviceDetail.updatedAt = new Date();
    await serviceDetail.save();
    return serviceDetail;
};

const deleteServiceDetail = async (serviceDetailId) => {
    const serviceDetail = await ServiceDetail.findById(serviceDetailId);
    if (!serviceDetail) {
      throw new Error("Service detail not found");
    }
    await serviceDetail.deleteOne();
    return { message: "Service detail deleted successfully" };
};

 export const getServiceDetailById = async (serviceDetailId) => {
     const serviceDetail = await ServiceDetail.findById(serviceDetailId)
         .populate("service")
         .populate("garage",'name address phone');

     if (!serviceDetail) {
         console.log("Service detail not found");
     } else {
         console.log("Service detail found:", serviceDetail);
     }

     return serviceDetail;
 };


export { addServiceDetail, getServiceDetailsByGarage, updateServiceDetail, deleteServiceDetail };