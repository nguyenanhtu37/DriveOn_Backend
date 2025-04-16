import Garage from "../models/garage.js";
import User from "../models/user.js";
import bcrypt from "bcrypt";
import {
  validateGarageRegistration,
  validateUpdateGarage,
} from "../validator/garageValidator.js";
import { validateSignup } from "../validator/authValidator.js";
import Role from "../models/role.js";
import Feedback from "../models/feedback.js";
import ServiceDetail from "../models/serviceDetail.js";
import axios from "axios";
import {
  haversineDistance,
  getDrivingDistance,
  getDistancesToGarages,
} from "../utils/distanceHelper.js";
import transporter from "../config/mailer.js";

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
    "name email phone"
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
      "email name phone"
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
    }).populate("user", "email name phone");
    return garages;
  } catch (err) {
    throw new Error(err.message);
  }
};

const getGarageRegistrationById = async (garageId) => {
  const garage = await Garage.findById(garageId);
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
      "name email"
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
      "name email"
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
    console.log("defaultRole: ", defaultRole._id);
    const newUser = new User({
      name,
      email,
      phone,
      password: hashedPassword,
      roles: [defaultRole._id],
      status: "active",
      garageList: garageId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await newUser.save();
    return newUser;
  } catch (err) {
    console.error("Error adding staff:", err.message);
    throw new Error(err.message);
  }
};

const viewStaff = async (userId, garageId) => {
  console.log("userId: ", userId);
  console.log("garageId: ", garageId);
  const garage = await Garage.findById(garageId);
  if (!garage.user.includes(userId)) {
    throw new Error("Unauthorized");
  }
  if (!garage) {
    throw new Error("Garage not found");
  }
  const staffList = await User.find({
    garageList: garageId,
    roles: "67b60df8c465fe4f943b98cc",
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
    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = "inactive";
    user.updatedAt = new Date();
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
    const user = await User.findById(staffId);
    if (!user) {
      throw new Error("User not found");
    }
    user.status = "active";
    user.updatedAt = new Date();
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
    const staff = await User.findById(staffId);
    if (!staff || !staff.garageList.includes(garageId)) {
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
    garage.updatedAt = new Date();
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
    garage.updatedAt = new Date();
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

    const enhancedGarages = [];
    for (const garage of garages) {
      const enhancedGarage = await enhanceGarageInfo(
        garage,
        address,
        openTime,
        closeTime,
        operatingDaysArray
      );
      if (enhancedGarage.isOpen && enhancedGarage.distance <= distance) {
        enhancedGarages.push(enhancedGarage);
      }
    }

    enhancedGarages.sort(compareGarages);

    return enhancedGarages;
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
  const garageAddress = garage.address;
  const distance = await getDistancesToGarages(userAddress, garageAddress);

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

const viewAllGaragesByAdmin = async (page = 1, limit = 10) => {
  try {
    const garages = await Garage.find()
      .populate("user", "name email phone")
      .skip((page - 1) * limit)
      .limit(limit);
    return garages;
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
}) => {
  try {
    const query = { status: { $in: ["enabled"] } };

    if (keySearch) query.name = { $regex: keySearch, $options: "i" };
    if (operating_days)
      query.operating_days = { $in: operating_days.split(",") };
    if (rating) query.ratingAverage = { $gte: rating };
    if (tag) query.tag = tag;

    if (openTime && closeTime) {
      query.$and = [
        { openTime: { $lte: openTime } },
        { closeTime: { $gte: closeTime } },
      ];
    }

    if (province || district) {
      query.$and = [];
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
      const destinations = garages
        .map(
          (garage) =>
            `${garage.location.coordinates[1]},${garage.location.coordinates[0]}`
        )
        .join("|");

      const apiUrl = `https://api.distancematrix.ai/maps/api/distancematrix/json?origins=${currentLocation}&destinations=${destinations}&key=hUvifHIuGWgvi1aCIh6Pvzp9oJlNiIq3Q6F497ytNdPkgsXGnTiEdp0bbHKZmFTq`;

      const response = await axios.get(apiUrl);

      if (response.data.status !== "OK") {
        throw new Error(
          response.data.error_message || "Error fetching distances"
        );
      }

      const distances = response.data.rows[0].elements.map(
        (element) => element.distance.value / 1000
      );

      garages = garages
        .map((garage, index) => ({
          ...garage.toObject(),
          distance: distances[index],
        }))
        .filter((garage) => garage.distance <= distance);
    }

    garages.sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      if (a.tag === "pro" && b.tag !== "pro") return -1;
      if (a.tag !== "pro" && b.tag === "pro") return 1;
      return 0;
    });
    return garages;
  } catch (err) {
    console.error("Error in viewGaragesWithSearchParams:", err.message);
    throw new Error(err.message);
  }
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
};
