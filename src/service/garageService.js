import Garage from "../models/garage.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import {
  validateGarageRegistration,
  validateUpdateGarage,
} from "../validator/garageValidator.js";
import { validateSignup } from "../validator/authValidator.js";
import Role from "../models/role.js";
import Service from "../models/service.js";
import Feedback from "../models/feedback.js";
import Brand from "../models/brand.js";
import ServiceDetail from "../models/serviceDetail.js";
import axios from "axios";
import {
  haversineDistance,
  getDrivingDistance,
  getDistancesToGarages,
} from "../utils/distanceHelper.js";
import transporter from "../config/mailer.js";
import Appointment from "../models/appointment.js";
import mongoose from "mongoose";
import { sendMultipleNotifications } from "./fcmService.js";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone.js";
import Favorite from "../models/favorite.js";

const registerGarage = async (user, garageData) => {
  console.log(garageData);
  // Validate garageData
  validateGarageRegistration(garageData);
  const {
    name,
    address,
    phone,
    email,
    description,
    openTime,
    closeTime,
    operating_days,
    facadeImages,
    interiorImages,
    documentImages,
    status,
    location,
    tag,
  } = garageData;
  const newGarage = new Garage({
    name,
    address,
    phone,
    email,
    description,
    openTime,
    closeTime,
    operating_days,
    facadeImages,
    interiorImages,
    documentImages,
    location,
    user: [user.id],
    status,
    tag,
  });
  await newGarage.save();
  await User.findByIdAndUpdate(user.id, {
    $push: { garageList: newGarage._id },
  });
  return newGarage;
};

const viewGarages = async (userId) => {
  const garages = await Garage.find({ user: { $in: [userId] } });
  console.log("userId: ", userId);
  console.log("garages: ", garages);
  return garages;
};

const getGarageById = async (garageId) => {
  const garage = await Garage.findById(garageId).populate(
    "user",
    "name email phone avatar"
  );
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

const updateGarage = async (userId, garageId, updateData) => {
  // Validate updateData
  validateUpdateGarage(updateData);

  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  if (!garage.user.includes(userId)) {
    throw new Error("Unauthorized");
  }
  // Cập nhật các trường cho garage hahaa
  const fieldsToUpdate = [
    "name",
    "address",
    "phone",
    "email",
    "description",
    "openTime",
    "closeTime",
    "operating_days",
    "facadeImages",
    "interiorImages",
    "documentImages",
    "location",
  ];
  fieldsToUpdate.forEach((field) => {
    if (updateData[field] !== undefined) {
      garage[field] = updateData[field];
    }
  });

  garage.updatedAt = new Date();
  await garage.save();
  return garage;
};

const deleteGarage = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  if (garage.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }
  await garage.deleteOne();
  return { message: "Garage deleted successfully" };
};

const viewGarageRegistrations = async () => {
  try {
    const garages = await Garage.find({ status: "pending" }).populate(
      "user",
      "email name phone avatar"
    );
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const viewGarageRegistrationsCarOwner = async (id) => {
  try {
    const garages = await Garage.find({
      user: id,
      status: { $in: ["pending", "rejected"] },
    }).populate("user", "email name phone avatar");
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getGarageRegistrationById = async (garageId) => {
  const garage = await Garage.findById(garageId).populate(
    "user",
    "email name phone avatar"
  );
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

const approveGarageRegistration = async (garageId) => {
  try {
    // const garage = await Garage.findById(garageId);
    const garage = await Garage.findById(garageId).populate(
      "user",
      "name email avatar"
    );
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = ["approved", "enabled"];
    await garage.save();

    // Gửi email xác nhận đến user
    const user = garage.user[0]; // Lấy thông tin user đầu tiên trong danh sách
    if (user && user.email) {
      // Kiểm tra nếu user và email tồn tại
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: user.email,
        subject: "Garage Registration Approved",
        html: `
          <h2>Hello ${user.name},</h2>
          <p>Your garage registration has been successfully approved!</p>
          <h3>Information Details:</h3>
          <ul>
            <li><strong>Garage Name:</strong> ${garage.name}</li>
            <li><strong>Address:</strong> ${garage.address}</li>
            <li><strong>Phone Number:</strong> ${garage.phone}</li>
            <li><strong>Email:</strong> ${garage.email}</li>
          </ul>
          <p>You can now start managing your garage on our system.</p>
          <p>Thank you for using our service!</p>
        `,
      });
    } else {
      console.error("User or email not found for garage:", garageId);
    }

    return { message: "Garage registration approved successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

const rejectGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId).populate(
      "user",
      "name email avatar"
    );
    if (!garage) {
      throw new Error("Garage not found");
    }

    garage.status = "rejected";
    await garage.save();

    // Gửi email thông báo từ chối đến user
    const user = garage.user[0]; // Lấy thông tin user đầu tiên trong danh sách
    if (user && user.email) {
      await transporter.sendMail({
        from: process.env.MAIL_USER,
        to: user.email,
        subject: "Garage Registration Rejected",
        html: `
          <h2>Hello ${user.name},</h2>
          <p>We regret to inform you that your garage registration has been rejected.</p>
          <h3>Information Details:</h3>
          <ul>
            <li><strong>Garage Name:</strong> ${garage.name}</li>
            <li><strong>Address:</strong> ${garage.address}</li>
            <li><strong>Phone Number:</strong> ${garage.phone}</li>
            <li><strong>Email:</strong> ${garage.email}</li>
          </ul>
          <p>If you have any questions, please contact us for further assistance.</p>
          <p>Thank you for using our service!</p>
        `,
      });
    } else {
      console.error("User or email not found for garage:", garageId);
    }

    return { message: "Garage registration rejected successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

const addStaff = async (userId, garageId, staffData) => {
  try {
    // Validate staff data
    validateSignup(staffData);
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }

    const { name, email, phone, password } = staffData;
    const hashedPassword = await bcrypt.hash(password, 10);
    const defaultRole = await Role.findOne({ roleName: "staff" });

    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      roles: [defaultRole._id],
      status: "active",
      // Removing garageList field as it's not in your schema
    });
    await newUser.save();

    // Add staff to garage.staffs array
    await Garage.findByIdAndUpdate(garageId, {
      $push: { staffs: newUser._id },
    });

    return newUser;
  } catch (err) {
    console.error("Error adding staff:", err.message);
    throw new Error(err.message);
  }
};

const viewStaff = async (userId, garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }

  if (!garage.user.includes(userId)) {
    throw new Error("Unauthorized");
  }

  // Get all users in the staffs array
  const staffList = await User.find({
    _id: { $in: garage.staffs },
    roles: "67b60df8c465fe4f943b98cc", // Staff role ID
  });

  return staffList;
};

const viewGarageExisting = async () => {
  try {
    const garages = await Garage.find({ status: "enabled" });
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const disableStaff = async (userId, garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }

    // Check if staff is associated with this garage
    if (!garage.staffs.includes(staffId)) {
      throw new Error("Staff not associated with this garage");
    }

    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }

    user.status = "inactive";
    // timestamps will automatically update updatedAt
    await user.save();

    return user;
  } catch (err) {
    console.error("Error disabling staff:", err.message);
    throw new Error(err.message);
  }
};

const enableStaff = async (userId, garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    if (!garage.user.includes(userId)) {
      throw new Error("Unauthorized");
    }

    // Check if staff is associated with this garage
    if (!garage.staffs.includes(staffId)) {
      throw new Error("Staff not associated with this garage");
    }

    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }

    user.status = "active";
    // timestamps will automatically update updatedAt
    await user.save();

    return user;
  } catch (err) {
    console.error("Error enabling staff:", err.message);
    throw new Error(err.message);
  }
};

const getStaffById = async (garageId, staffId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    // Check if staff is associated with this garage
    if (!garage.staffs.includes(staffId)) {
      throw new Error("Staff not associated with this garage");
    }

    const staff = await User.findById(staffId);
    if (!staff) {
      throw new Error("Staff not found");
    }

    return staff;
  } catch (err) {
    console.error("Error getting staff by ID:", err.message);
    throw new Error(err.message);
  }
};

const enableGarage = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    if (!garage.status.includes("enabled")) {
      garage.status = garage.status.filter((status) => status !== "disabled");
      garage.status.push("enabled");
    }

    // timestamps will automatically update updatedAt
    await garage.save();

    return garage;
  } catch (err) {
    console.error("Error enabling garage:", err.message);
    throw new Error(err.message);
  }
};

const disableGarage = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }

    if (!garage.status.includes("disabled")) {
      garage.status = garage.status.filter((status) => status !== "enabled");
      garage.status.push("disabled");
    }

    // timestamps will automatically update updatedAt
    await garage.save();

    return garage;
  } catch (err) {
    console.error("Error disabling garage:", err.message);
    throw new Error(err.message);
  }
};

export const calculateAverageRating = async (garageId) => {
  const feedbacks = await Feedback.find({ garage: garageId });

  const averageRating =
    feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
      feedbacks.length || 0;
  return averageRating;
};

// chim bay (openstreetmap) thì dùng cái này
//filter garageaear
// export const findGarages = async ({
//   address,
//   openTime,
//   closeTime,
//   operatingDaysArray = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
//   rating,
//   distance,
// }) => {
//   try {
//     openTime = openTime || "00:00";
//     closeTime = closeTime || "23:59";
//     operatingDaysArray = operatingDaysArray.length ? operatingDaysArray : ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
//     rating = rating || 0;
//     distance = distance || 10;

//     // nhap address => get coordinate (chim bay by openstreetmap nominatim)
//     const coordinates = await getCoordinates(address);
//     if (!coordinates) throw new Error("Không tìm thấy tọa độ cho địa chỉ này.");
//     const { lat: userLat, lon: userLon } = coordinates;

//     // get garage tu db theo tieu chi: rating? va ngay hoat dong
//     let garages = await Garage.find({
//       ratingAverage: { $gte: rating },
//       operating_days: { $in: operatingDaysArray },
//     });

//     garages = garages
//       .map((garage) => enhanceGarageInfo(garage, userLat, userLon, openTime, closeTime))
//       .filter((garage) => garage.distance <= distance); // loc theo kcach

//     // sort
//     garages.sort(compareGarages);

//     return garages;
//   } catch (error) {
//     throw new Error("Lỗi khi tìm garage: " + error.message);
//   }
// };

// cho chim bay =))
// const enhanceGarageInfo = (garage, userLat, userLon, openTime, closeTime) => {
//   const [garageLon, garageLat] = garage.location.coordinates;
//   const distance = haversineDistance(userLat, userLon, garageLat, garageLon);
//   return {
//     ...garage.toObject(),
//     distance,
//     isOpen: checkGarageOpen(garage, openTime, closeTime),
//     isPro: garage.tag === "pro",
//   };
// };

// get coordinates (chim bay)
// const getCoordinates = async (address) => {
//   try {
//     const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
//     const response = await axios.get(url, { headers: { "User-Agent": "DriveOn-App" } });
//     if (response.data.length === 0) return null;
//     return { lat: parseFloat(response.data[0].lat), lon: parseFloat(response.data[0].lon) };
//   } catch {
//     return null;
//   }
// };

// xe chạy (distancematrix.ai)
export const findGarages = async ({
  address,
  openTime,
  closeTime,
  operatingDaysArray = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ],
  rating,
  distance,
}) => {
  try {
    openTime = openTime || "00:00";
    closeTime = closeTime || "23:59";
    operatingDaysArray = operatingDaysArray.length
      ? operatingDaysArray
      : [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ];
    rating = rating || 0;
    distance = distance || 10;

    let garages = await Garage.find({
      ratingAverage: { $gte: rating },
      operating_days: { $in: operatingDaysArray },
      status: { $in: ["approved", "enabled"] },
    });

    const enhancedGarages = await Promise.all(
      garages.map((garage) =>
        enhanceGarageInfo(
          garage,
          address,
          openTime,
          closeTime,
          operatingDaysArray
        )
      )
    );

    const filteredGarages = enhancedGarages.filter(
      (g) => g.isOpen && g.distance <= distance
    );

    filteredGarages.sort(compareGarages);
    return filteredGarages;
  } catch (error) {
    throw new Error("Lỗi khi tìm garage: " + error.message);
  }
};

// lam theo distanmatrix.ai
const enhanceGarageInfo = async (
  garage,
  userAddress,
  userOpenTime,
  userCloseTime,
  userOperatingDays
) => {
  const distanceResult = await getDistancesToGarages(userAddress, [garage]);
  const distance = distanceResult[0]?.distance || null;

  return {
    ...garage.toObject(),
    distance,
    isOpen: checkGarageOpen(
      garage,
      userOpenTime,
      userCloseTime,
      userOperatingDays
    ),
    isPro: garage.tag === "pro",
  };
};

const checkGarageOpen = (
  garage,
  userOpenTime,
  userCloseTime,
  userOperatingDays
) => {
  const now = new Date();
  const today = now.toLocaleString("en-US", { weekday: "long" });

  userOpenTime = userOpenTime || "00:00";
  userCloseTime = userCloseTime || "23:59";

  // check operating_days
  const hasMatchingDays = garage.operating_days.some((day) =>
    userOperatingDays.includes(day)
  );

  if (!hasMatchingDays) {
    return false; // no overlappppp
  }

  // check openTime, closeTime
  const [garageOpenHour, garageOpenMinute] = garage.openTime
    .split(":")
    .map(Number);
  const [garageCloseHour, garageCloseMinute] = garage.closeTime
    .split(":")
    .map(Number);
  const [userOpenHour, userOpenMinute] = userOpenTime.split(":").map(Number);
  const [userCloseHour, userCloseMinute] = userCloseTime.split(":").map(Number);

  // overlap calculation
  const userStart = userOpenHour * 60 + userOpenMinute; // user open time input (min)
  const userEnd = userCloseHour * 60 + userCloseMinute; // uer close time input (min)
  const garageStart = garageOpenHour * 60 + garageOpenMinute; // openTime của garage (min)
  const garageEnd = garageCloseHour * 60 + garageCloseMinute; // closeTime của garage (min)

  // check overlap giua user req vs giờ garage hoạt động
  const hasOverlap =
    Math.max(userStart, garageStart) < Math.min(userEnd, garageEnd);
  // console.log("hasOverlap: ", hasOverlap);

  if (!hasOverlap) {
    return false; // no overlap giữa 2 time range
  }

  return true; // Garage đang mở (availability)
};

const compareGarages = (a, b) => {
  // 1st priority
  if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;
  // 2nd priority
  if (a.isPro && !b.isPro) return -1;
  if (!a.isPro && b.isPro) return 1;
  // 3rd priotiry
  if (a.ratingAverage !== b.ratingAverage)
    return b.ratingAverage - a.ratingAverage;
  // final priority while sorting
  return a.distance - b.distance;
};

const viewAllGaragesByAdmin = async (page = 1, limit = 10, keySearch) => {
  try {
    const skip = (page - 1) * limit;
    const query = {
      status: { $in: ["approved", "rejected", "enabled", "disabled"] },
    };

    if (keySearch) {
      query.name = { $regex: keySearch, $options: "i" };
    }

    const garages = await Garage.find(query)
      .populate("user", "name email phone avatar")
      .skip(skip)
      .limit(limit);

    const totalExits = await Garage.countDocuments(query);

    return {
      garages,
      totalGarages: garages,
      totalPages: Math.ceil(totalExits / limit),
      currentPage: page,
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

const viewGaragesWithSearchParams = async ({
  services,
  province,
  district,
  rating,
  keySearch,
  operating_days,
  tag,
  openTime,
  closeTime,
  distance,
  currentLocation,
  page = 1,
  limit = 10,
}) => {
  try {
    const query = { status: { $in: ["enabled"] } };

    if (keySearch) query.name = { $regex: keySearch, $options: "i" };
    if (operating_days)
      query.operating_days = { $in: operating_days.split(",") };
    if (rating) query.ratingAverage = { $gte: rating };
    if (tag) query.tag = tag;

    if (openTime && closeTime) {
      query.$and = [];
      query.$and.push({ openTime: { $lte: openTime } });
      query.$and.push({ closeTime: { $gte: closeTime } });
    }

    if (province || district) {
      if (!query.$and) query.$and = [];
      if (province)
        query.$and.push({ address: { $regex: new RegExp(province, "i") } });
      if (district) {
        const cleanedDistrict = district.split(/\s+/).slice(1).join(" ");
        query.$and.push({
          address: { $regex: new RegExp(cleanedDistrict, "i") },
        });
      }
    }

    let garages = await Garage.find(query).populate("user", "name email phone");

    if (services) {
      const serviceDetails = await ServiceDetail.find({
        service: { $in: services.split(",") },
      }).distinct("garage");

      garages = garages.filter((garage) =>
        serviceDetails.some((serviceId) => serviceId.equals(garage._id))
      );
    }

    if (currentLocation && distance && garages.length > 0) {
      const [lat, lng] = currentLocation
        .split(",")
        .map((coord) => parseFloat(coord));
      if (isNaN(lat) || isNaN(lng)) {
        throw new Error(
          "Invalid location format. Expected 'latitude,longitude'"
        );
      }

      const point = [lng, lat];

      const nearbyGarages = await Garage.aggregate([
        {
          $geoNear: {
            near: { type: "Point", coordinates: point },
            distanceField: "distance",
            maxDistance: distance * 1000,
            spherical: true,
            distanceMultiplier: 0.001,
          },
        },
        {
          $match: {
            _id: { $in: garages.map((g) => g._id) },
          },
        },
      ]);

      const garageMap = new Map(
        nearbyGarages.map((g) => [g._id.toString(), g.distance])
      );
      garages = garages
        .filter((g) => garageMap.has(g._id.toString()))
        .map((g) => ({
          ...g.toObject(),
          distance: garageMap.get(g._id.toString()),
        }));
    }

    garages.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.tag === "pro" && b.tag !== "pro") return -1;
      if (a.tag !== "pro" && b.tag === "pro") return 1;
      return 0;
    });

    // Calculate pagination metadata
    const totalItems = garages.length;
    const totalPages = Math.ceil(totalItems / limit);

    // Apply pagination
    const paginatedGarages = garages.slice((page - 1) * limit, page * limit);

    return {
      garages: paginatedGarages,
      pagination: {
        totalItems,
        totalPages,
        currentPage: parseInt(page),
        limit: parseInt(limit),
      },
    };
  } catch (err) {
    console.error("Error in viewGaragesWithSearchParams:", err.message);
    throw new Error(err.message);
  }
};

export const findRescueGarages = async (latitude, longitude) => {
  try {
    /*
    Cứu hộ:
    - Để phạm vi xa quá thì ko ai nhận cứu hộ
    - Để phạm vi rộng quá thì query trong db lâu hơn
    => Tạm thời lấy ra các garage trong 50km
    */
    const garages = await Garage.aggregate([
      {
        $geoNear: {
          near: {
            type: "Point",
            coordinates: [parseFloat(longitude), parseFloat(latitude)],
          },
          distanceField: "distance",
          maxDistance: 50000, // 50km
          spherical: true,
          distanceMultiplier: 0.001, // đổi mét => km, vì cái ni hắn trả về đơn vị mét
        },
      },
      {
        $match: { status: "enabled" }, // chỉ lấy garage enable thôi (availabilityavailability)
      },
      {
        $project: {
          ...Object.fromEntries(
            Object.keys(Garage.schema.paths).map((key) => [key, 1])
          ),
          deviceTokens: 1,
          distance: 1,
        },
      },
    ]);

    dayjs.extend(utc);
    dayjs.extend(timezone);
    // Lấy giờ VN
    const currentHour = dayjs().tz("Asia/Ho_Chi_Minh").hour();
    const currentDay = dayjs().tz("Asia/Ho_Chi_Minh").format("dddd");
    console.log("currentHour: ", currentHour);
    console.log("currentDay: ", currentDay);

    const openGarages = garages.filter((garage) => {
      try {
        if (!garage.openTime || !garage.closeTime) return false;
        const openHour = parseInt(garage.openTime.split(":")[0], 10);
        const closeHour = parseInt(garage.closeTime.split(":")[0], 10) || 24;
        console.log("openHour: ", openHour);
        console.log("closeHour: ", closeHour);
        return (
          Array.isArray(garage.operating_days) &&
          garage.operating_days.includes(currentDay) &&
          currentHour >= openHour &&
          currentHour < closeHour
        );
      } catch {
        return false;
      }
    });

    const emergencyService = await Service.findOne({
      name: "Cứu hộ",
      isDeleted: false,
    });
    if (!emergencyService) throw new Error("Không tìm thấy dịch vụ cứu hộ");

    const emergencyServiceDetails = await ServiceDetail.find({
      service: emergencyService._id,
      isDeleted: false,
    }).select("garage");

    const emergencyGarageIds = emergencyServiceDetails.map((d) =>
      d.garage.toString()
    );

    const garagesWithFlag = openGarages.map((garage) => ({
      ...garage,
      hasEmergency: emergencyGarageIds.includes(garage._id.toString()),
    }));

    const sortedGarages = garagesWithFlag.sort((a, b) => {
      if (a.hasEmergency && !b.hasEmergency) return -1;
      if (!a.hasEmergency && b.hasEmergency) return 1;
      if (a.tag === "pro" && b.tag !== "pro") return -1;
      if (a.tag !== "pro" && b.tag === "pro") return 1;
      if (a.distance !== b.distance) return a.distance - b.distance;
      return b.ratingAverage - a.ratingAverage;
    });

    return sortedGarages.slice(0, 10);
  } catch (error) {
    console.error("Error in findRescueGarages:", error.message);
    throw new Error(error.message || "Không thể tìm garage cứu hộ");
  }
};

const viewDashboardOverview = async (garageId, userId) => {
  try {
    const feedbacks = await Feedback.find({ garage: garageId });
    const services = await ServiceDetail.find({ garage: garageId }).populate(
      "service",
      "name"
    );
    const staff = await User.find({
      garageList: garageId,
      roles: "67b60df8c465fe4f943b98cc",
    });

    const appointments = await Appointment.find({ garage: garageId });
    const totalAppointments = appointments.length;
    const totalFeedbacks = feedbacks.length;
    const totalServices = services.length;

    return {
      totalFeedbacks,
      totalServices,
      totalStaff: staff.length,
      totalAppointments,
    };
  } catch (err) {
    console.error("Error in viewDashboardOverview:", err.message);
    throw new Error(err.message);
  }
};

const viewDashboardChart = async (garageId, userId) => {
  try {
    const appointments = await Appointment.aggregate([
      {
        $match: {
          garage: mongoose.Types.ObjectId.createFromHexString(garageId),
          status: "Completed",
        },
      },
      {
        $project: {
          year: { $year: "$end" },
          month: { $month: "$end" },
        },
      },
      {
        $group: {
          _id: { year: "$year", month: "$month" },
          totalAppointments: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.year": 1, "_id.month": 1 },
      },
    ]);

    const months = Array.from({ length: 12 }, (_, i) => i + 1);

    const result = months.map((month) => {
      const monthData = appointments.find((item) => item._id.month === month);
      return {
        month,
        totalAppointments: monthData ? monthData.totalAppointments : 0,
      };
    });

    const serviceUsage = await Appointment.aggregate([
      {
        $match: {
          garage: mongoose.Types.ObjectId.createFromHexString(garageId), // Lọc theo garageId
        },
      },
      {
        $unwind: "$service",
      },
      {
        $group: {
          _id: "$service",
          totalUses: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "servicedetails",
          localField: "_id",
          foreignField: "_id",
          as: "serviceInfo",
        },
      },
      {
        $unwind: "$serviceInfo",
      },
      {
        $project: {
          serviceName: "$serviceInfo.name",
          serviceId: "$serviceInfo._id",
          totalUses: 1,
          _id: 0,
        },
      },
      { $sort: { totalUses: -1 } },
    ]);

    // const staff = await User.find({
    //   garageList: garageId,
    //   roles: "67b60df8c465fe4f943b98cc",
    // });

    return {
      appointments: result,
      // feedbacks,
      services: serviceUsage,
      // staff,
    };
  } catch (err) {
    console.error("Error in viewDashboardChart:", err.message);
    throw new Error(err.message);
  }
};

export const getAdminDashboardOverview = async () => {
  try {
    const totalGarages = await Garage.countDocuments();
    const totalBrands = await Brand.countDocuments();
    const totalServices = await Service.countDocuments();
    const totalUsers = await User.countDocuments();

    return {
      totalGarages,
      totalBrands,
      totalServices,
      totalUsers,
    };
  } catch (err) {
    console.error("Error in getAdminDashboardOverview:", err.message);
    throw new Error(err.message);
  }
};

export const getGarageCountByStatusAndMonth = async () => {
  try {
    const result = await Garage.aggregate([
      {
        $match: {
          status: { $in: ["enabled", "disabled"] }, // Chỉ lấy enabled hoặc disabled
        },
      },
      {
        $group: {
          _id: { month: { $month: "$createdAt" } },
          garages: { $sum: 1 },
        },
      },
      {
        $project: {
          _id: 0,
          month: "$_id.month",
          garages: 1,
        },
      },
    ]);

    // Fill đủ 12 tháng
    const fullMonths = Array.from({ length: 12 }, (_, i) => {
      const month = i + 1;
      const found = result.find((r) => r.month === month);
      return {
        month,
        garages: found ? found.garages : 0,
      };
    });

    return fullMonths;
  } catch (err) {
    console.error("Error in getGarageCountByStatusAndMonth:", err.message);
    throw new Error(err.message);
  }
};

const getGarageList = async () => {
  const garagePros = await Garage.find({ tag: "pro" });
  const topFavoritesAgg = await Favorite.aggregate([
    { $group: { _id: "$garage", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "garages",
        localField: "_id",
        foreignField: "_id",
        as: "garage",
      },
    },
    { $unwind: "$garage" },
    {
      $replaceRoot: { newRoot: "$garage" },
    },
    // Add fields for sorting
    {
      $addFields: {
        isPro: { $cond: [{ $eq: ["$tag", "pro"] }, 1, 0] },
      },
    },
    // Sort: pro first, then by ratingAverage desc
    {
      $sort: { isPro: -1, ratingAverage: -1 },
    },
    { $limit: 10 },
  ]);
  const topFavorites = topFavoritesAgg;

  const topRated = await Garage.find().sort({ ratingAverage: -1 }).limit(10);

  const mostBooked = await Appointment.aggregate([
    { $group: { _id: "$garage", count: { $sum: 1 } } },
    {
      $lookup: {
        from: "garages",
        localField: "_id",
        foreignField: "_id",
        as: "garage",
      },
    },
    { $unwind: "$garage" },
    {
      $addFields: {
        isPro: { $cond: [{ $eq: ["$garage.tag", "pro"] }, 1, 0] },
        ratingAverage: "$garage.ratingAverage",
      },
    },
    // Sort: pro first, then by ratingAverage desc, then by most booked
    { $sort: { isPro: -1, ratingAverage: -1, count: -1 } },
    { $replaceRoot: { newRoot: "$garage" } },
    { $limit: 10 },
  ]);

  return {
    garagePros,
    topFavorites,
    topRated,
    mostBooked,
  };
};

export {
  registerGarage,
  viewGarages,
  getGarageById,
  updateGarage,
  deleteGarage,
  viewGarageRegistrations,
  approveGarageRegistration,
  rejectGarageRegistration,
  getGarageRegistrationById,
  addStaff,
  viewStaff,
  disableStaff,
  enableStaff,
  getStaffById,
  enableGarage,
  disableGarage,
  viewGarageExisting,
  viewGaragesWithSearchParams,
  viewAllGaragesByAdmin,
  viewGarageRegistrationsCarOwner,
  viewDashboardOverview,
  viewDashboardChart,
  getGarageList,
};
