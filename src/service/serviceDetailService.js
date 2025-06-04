import axios from "axios";
import dotenv from "dotenv";

import ServiceDetail from "../models/serviceDetail.js";
import Garage from "../models/garage.js";
import Service from "../models/service.js";
import {
  validateAddServiceDetail,
  validateUpdateServiceDetail,
} from "../validator/serviceDetailValidator.js";

dotenv.config();

const addServiceDetail = async (serviceDetailData) => {
  // console.log(serviceDetailData);
  // Validate service detail data
  validateAddServiceDetail(serviceDetailData);

  const { service, garage, name, description, images, price, duration } =
    serviceDetailData;
  const newServiceDetail = new ServiceDetail({
    service,
    garage,
    name,
    description,
    images,
    price,
    duration,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  await newServiceDetail.save();
  return newServiceDetail;
};


const getServiceDetailsByGarage = async (garageId, page = 1, limit = 6) => {
  const garageExists = await ServiceDetail.exists({ garage: garageId });
  if (!garageExists) {
    throw new Error("Garage not found");
  }
  const skip = (page - 1) * limit;
  const [serviceDetails, total] = await Promise.all([
    ServiceDetail.find({
      garage: garageId,
      isDeleted: false,
    })
      .populate("service", "name")
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    ServiceDetail.countDocuments({ garage: garageId, isDeleted: false }),
  ]);
  return {
    serviceDetails,
    total,
    totalPages: Math.ceil(total / limit),
    currentPage: page,
  };
};

const updateServiceDetail = async (serviceDetailId, updateData) => {
  // Validate update service detail
  validateUpdateServiceDetail(updateData);

  const serviceDetail = await ServiceDetail.findById(serviceDetailId);
  if (!serviceDetail) {
    throw new Error("Service detail not found");
  }
  serviceDetail.name = updateData.name || serviceDetail.name;
  serviceDetail.description =
    updateData.description || serviceDetail.description;
  serviceDetail.images = updateData.images || serviceDetail.images;
  serviceDetail.price = updateData.price || serviceDetail.price;
  serviceDetail.duration = updateData.duration || serviceDetail.duration;
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
  const serviceDetail = await ServiceDetail.findOne({
    _id: serviceDetailId,
    isDeleted: false, 
  })
    .populate("service")
    .populate("garage", "name address phone");

  if (!serviceDetail) {
    console.log("Service detail not found");
  } else {
    console.log("Service detail found:", serviceDetail);
  }

  return serviceDetail;
};

// export const searchServices = async (name, location) => {
//   try {
//     let garages = [];

//     // Nếu có location, tìm kiếm garage gần vị trí
//     if (location) {
//       let parsedLocation;
//       try {
//         // Sử dụng DistanceMatrix.ai để chuyển đổi địa chỉ thành tọa độ
//         const apiKey = process.env.DISTANCEMATRIX_API_KEY;
//         const url = `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodeURIComponent(
//           location
//         )}&key=${apiKey}`;

//         const response = await axios.get(url);

//         // Kiểm tra nếu không tìm thấy kết quả
//         if (
//           !response.data ||
//           response.data.status !== "OK" ||
//           !response.data.result ||
//           response.data.result.length === 0
//         ) {
//           throw new Error("Invalid location. Unable to find coordinates.");
//         }

//         // Lấy tọa độ từ kết quả trả về
//         const { lat, lng } = response.data.result[0].geometry.location;
//         parsedLocation = { lat, lon: lng };
//       } catch (error) {
//         console.error(
//           "Error fetching coordinates from DistanceMatrix.ai:",
//           error.message
//         );
//         throw new Error("Failed to fetch coordinates from location.");
//       }

//       const { lat, lon } = parsedLocation;

//       // Tìm kiếm garage gần vị trí
//       garages = await Garage.aggregate([
//         {
//           $geoNear: {
//             near: {
//               type: "Point",
//               coordinates: [parseFloat(lon), parseFloat(lat)],
//             },
//             distanceField: "distance",
//             maxDistance: 50000, // 50km
//             spherical: true,
//             distanceMultiplier: 0.001
//           },
//         },
//         {
//           $match: {
//             status: { $all: ["enabled", "approved"] },
//           },
//         },
//       ]);
//     }
//     // console.log("Garages found:", garages);

//     const garageIds =
//       garages.length > 0 ? garages.map((garage) => garage._id) : null;

//     const query = {
//       name: { $regex: name, $options: "i" },
//     };
//     if (garageIds) {
//       query.garage = { $in: garageIds };
//     }

//     let services = await ServiceDetail.find(query).populate(
//       "garage",
//       "name address location tag ratingAverage openTime closeTime operating_days"
//     );
//     console.log("Services before filter:", services);

//     const currentHour = new Date().getHours();
//     const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });

//     services = services.filter((service) => {
//       const garage = service.garage;
//       // console.log("Garage operating_days:", garage.operating_days);
//       // console.log("Current day:", currentDay);
//       if (!garage) return false;

//       if (!garage.operating_days.includes(currentDay)) return false;

//       const openHour = parseInt(garage.openTime.split(":")[0], 10);
//       const closeHour = parseInt(garage.closeTime.split(":")[0], 10);
//       return currentHour >= openHour && currentHour < closeHour;
//     });
//     // console.log("Services after filter:", services);

//     services.sort((a, b) => {
//       const garageA = a.garage;
//       const garageB = b.garage;

//       if (garageA.tag === "pro" && garageB.tag !== "pro") return -1;
//       if (garageA.tag !== "pro" && garageB.tag === "pro") return 1;

//       return garageB.ratingAverage - garageA.ratingAverage;
//     });

//     if (location) {
//       services = services.map((service) => {
//         const garage = garages.find(
//           (g) => g._id.toString() === service.garage._id.toString()
//         );
//         return {
//           ...service.toObject(),
//           distance: garage ? garage.distance : null,
//         };
//       });
//     }
//     // console.log("Services after map:", services);

//     return services;
//   } catch (error) {
//     console.error("Error in searchServices:", error);
//     throw new Error("Failed to search services");
//   }
// };

export const searchServices = async (name, location) => {
  let garageResult = [];
  let serviceResult = [];

  let parsedLocation = null;

  // Parse location (optional)
  if (location) {
    try {
      const apiKey = process.env.DISTANCEMATRIX_API_KEY;
      const url = `https://api.distancematrix.ai/maps/api/geocode/json?address=${encodeURIComponent(
        location
      )}&key=${apiKey}`;
      const response = await axios.get(url);

      if (
        !response.data ||
        response.data.status !== "OK" ||
        !response.data.result ||
        response.data.result.length === 0
      ) {
        throw new Error("Invalid location. Unable to find coordinates.");
      }

      const { lat, lng } = response.data.result[0].geometry.location;
      parsedLocation = { lat, lon: lng };
    } catch (error) {
      console.error(
        "Error fetching coordinates from DistanceMatrix.ai:",
        error.message
      );
      throw new Error("Failed to fetch coordinates from location.");
    }
  }

  // 1. Provided location
  if (parsedLocation) {
    const { lat, lon } = parsedLocation;

    // 1.1. Search garage match vs keyword input, gan location do
    garageResult = await Garage.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: 50000,
          spherical: true,
          distanceMultiplier: 0.001,
          query: {
            status: { $all: ["enabled", "approved"] },
            name: { $regex: name, $options: "i" },
          },
        },
      },
    ]);

    // 1.2. Search service match vs input keyword, trong khu vuc location (qua garage.location)
    const nearbyGarage = await Garage.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(lon), parseFloat(lat)],
          },
          distanceField: "distance",
          maxDistance: 50000,
          spherical: true,
          distanceMultiplier: 0.001,
          query: {
            status: { $all: ["enabled", "approved"] },
          },
        },
      },
    ]);

    const nearbyGarageIds = nearbyGarage.map((g) => g._id);

    serviceResult = await ServiceDetail.find({
      name: { $regex: name, $options: "i" },
      garage: { $in: nearbyGarageIds },
      isDeleted: false,
    }).populate(
      "garage",
      "name address location tag ratingAverage openTime closeTime operating_days"
    );
  } else {
    // kco provided location
    // Search garage theo ten => match input
    garageResult = await Garage.find({
      name: { $regex: name, $options: "i" },
      status: { $all: ["enabled", "approved"] },
    });

    // search service theo ten => match input
    serviceResult = await ServiceDetail.find({
      name: { $regex: name, $options: "i" },
      isDeleted: false,
    }).populate(
      "garage",
      "name address location tag ratingAverage openTime closeTime operating_days"
    );
  }

  // sort
  serviceResult.sort((a, b) => {
    const garageA = a.garage || {};
    const garageB = b.garage || {};

    const tagA = garageA.tag || "";
    const tagB = garageB.tag || "";

    const ratingA =
      typeof garageA.ratingAverage === "number" ? garageA.ratingAverage : 0;
    const ratingB =
      typeof garageB.ratingAverage === "number" ? garageB.ratingAverage : 0;

    // pro top
    if (tagA === "pro" && tagB !== "pro") return -1;
    if (tagA !== "pro" && tagB === "pro") return 1;

    // cung pro => high rating > low rating
    if (ratingA !== ratingB) return ratingB - ratingA;

    // rating = nhau => sort theo name (alphabet)
    const nameA = garageA.name || "";
    const nameB = garageB.name || "";
    return nameA.localeCompare(nameB);
  });

  return {
    garageResult,
    serviceResult,
  };
};

export const getEmergency = async (latitude, longitude) => {
  try {
    if (!latitude || !longitude) {
      throw new Error("Latitude and longitude are required");
    }

    const emergencyService = await Service.findOne({ name: "Emergency" });
    if (!emergencyService) {
      console.error("Emergency service not found");
      throw new Error("Emergency service not found");
    }
    console.log("Emergency service found:", emergencyService);

    const serviceDetails = await ServiceDetail.find({
      service: emergencyService._id,
    }).populate("garage");
    console.log("Service details linked to Emergency:", serviceDetails);

    // Tìm các garage gần vị trí người dùng
    const garages = await Garage.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          maxDistance: 10000, // 10km
          spherical: true,
        },
      },
      {
        $match: {
          status: { $all: ["enabled", "approved"] },
        },
      },
    ]);
    console.log("Nearby garages:", garages);

    // Lấy danh sách garageId từ kết quả tìm kiếm
    const nearbyGarageIds = garages.map((garage) => garage._id.toString());

    // Lọc các ServiceDetail có garage nằm trong danh sách garage gần vị trí người dùng
    const filteredServices = serviceDetails.filter((serviceDetail) =>
      nearbyGarageIds.includes(serviceDetail.garage._id.toString())
    );
    console.log("Filtered services:", filteredServices);

    // Lọc các garage đang mở cửa
    const currentHour = new Date().getHours();
    const currentDay = new Date().toLocaleString("en-US", { weekday: "long" });

    const openServices = filteredServices.filter((serviceDetail) => {
      const garage = serviceDetail.garage;
      if (!garage) return false;

      console.log(`Checking garage: ${garage.name}`);
      console.log("Garage operating days:", garage.operating_days);
      console.log("Garage open time:", garage.openTime);
      console.log("Garage close time:", garage.closeTime);

      // Kiểm tra ngày hoạt động
      if (!garage.operating_days.includes(currentDay)) {
        console.log(`Garage ${garage.name} is not operating on ${currentDay}`);
        return false;
      }

      // Kiểm tra giờ hoạt động
      const openHour = parseInt(garage.openTime.split(":")[0], 10);
      const closeHour = parseInt(garage.closeTime.split(":")[0], 10) || 24;
      if (currentHour < openHour || currentHour >= closeHour) {
        console.log(`Garage ${garage.name} is closed at ${currentHour}:00`);
        return false;
      }

      return true;
    });
    console.log("Open services:", openServices);

    openServices.sort((a, b) => {
      const garageA = a.garage;
      const garageB = b.garage;

      if (garageA.tag === "pro" && garageB.tag !== "pro") return -1;
      if (garageA.tag !== "pro" && garageB.tag === "pro") return 1;

      return garageB.ratingAverage - garageA.ratingAverage;
    });

    const result = openServices.map((serviceDetail) => {
      const garage = garages.find(
        (g) => g._id.toString() === serviceDetail.garage._id.toString()
      );
      return {
        ...serviceDetail.toObject(),
        distance: garage ? garage.distance : null,
      };
    });

    console.log("Final result:", result);

    return result;
  } catch (error) {
    console.error("Error in getEmergency:", error);
    throw new Error("Failed to get emergency garages");
  }
};

export const getServiceUsageCounts = async () => {
  try {
    const serviceUsageCounts = await Service.aggregate([
      {
        $lookup: {
          from: "servicedetails",
          localField: "_id",
          foreignField: "service",
          as: "serviceDetails",
        },
      },
      {
        $project: {
          serviceName: "$name",
          usageCount: { $size: "$serviceDetails" },
        },
      },
      {
        $match: {
          usageCount: { $gt: 0 },
        },
      },
      { $sort: { usageCount: -1 } },
    ]);

    return serviceUsageCounts;
  } catch (err) {
    console.error("Error in getServiceUsageCounts:", err.message);
    throw new Error(err.message);
  }
};

export const searchServicename = async ({ name, lat, lon }) => {
  try {
    const regex = new RegExp(name, "i");
    const services = await ServiceDetail.find({
      name: regex,
    }).populate(
      "garage",
      "name address location tag ratingAverage openTime closeTime operating_days"
    );
    if (lat && lon) {
      const garages = await Garage.aggregate([
        {
          $geoNear: {
            near: {
              type: "Point",
              coordinates: [parseFloat(lon), parseFloat(lat)],
            },
            distanceField: "distance",
            maxDistance: 5000, // 5km
            spherical: true,
            query: {
              status: { $all: ["enabled", "approved"] },
            },
          },
        },
      ]);

      const garageIds = garages.map((garage) => garage._id.toString());

      const nearbyServices = services.filter((service) =>
        garageIds.includes(service.garage._id.toString())
      );

      const farServices = services.filter(
        (service) => !garageIds.includes(service.garage._id.toString())
      );

      // sort pro to top //
      nearbyServices.sort((a, b) => {
        const garageA = a.garage;
        const garageB = b.garage;

        if (garageA.tag === "pro" && garageB.tag !== "pro") return -1;
        if (garageA.tag !== "pro" && garageB.tag === "pro") return 1;

        return garageB.ratingAverage - garageA.ratingAverage;
      });

      farServices.sort((a, b) => {
        const garageA = a.garage;
        const garageB = b.garage;

        if (garageA.tag === "pro" && garageB.tag !== "pro") return -1;
        if (garageA.tag !== "pro" && garageB.tag === "pro") return 1;

        return garageB.ratingAverage - garageA.ratingAverage;
      });

      return {
        nearbyServices: nearbyServices,
        farServices: farServices,
      };
    }

    return {
      nearbyServices: services,
      farServices: [],
    };
  } catch (error) {
    console.error("Error in searchServicesByname:", error);
    throw new Error("Failed to search services by name");
  }
};

export const softDeleteServiceDetail = async (serviceDetailId) => {
  // Tìm serviceDetail theo ID
  const serviceDetail = await ServiceDetail.findById(serviceDetailId);
  if (!serviceDetail) {
    throw new Error("Service detail not found");
  }

  // Thực hiện xóa mềm
  serviceDetail.isDeleted = true;
  serviceDetail.updatedAt = new Date();
  await serviceDetail.save();

  return { message: "Service detail soft deleted successfully" };
};

export {
  addServiceDetail,
  getServiceDetailsByGarage,
  updateServiceDetail,
  deleteServiceDetail,
};
