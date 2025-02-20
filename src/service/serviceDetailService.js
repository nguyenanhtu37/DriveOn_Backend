import ServiceDetail from "../models/serviceDetail.js";
import { validateAddServiceDetail } from "../validator/serviceDetailValidator.js";

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

export { addServiceDetail };