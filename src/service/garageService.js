import axios from "axios";
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
import { haversineDistance } from "../utils/distanceHelper.js";

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

const getGarageRegistrationById = async (garageId) => {
  const garage = await Garage.findById(garageId);
  if (!garage) {
    throw new Error("Garage not found");
  }
  return garage;
};

const approveGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    garage.status = ["enabled", "approved"];
    await garage.save();
    return { message: "Garage registration approved successfully" };
  } catch (err) {
    throw new Error(err.message);
  }
};

const rejectGarageRegistration = async (garageId) => {
  try {
    const garage = await Garage.findById(garageId);
    if (!garage) {
      throw new Error("Garage not found");
    }
    garage.status = "rejected";
    await garage.save();
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

// export const filterGaragesByRating = async (minRating = 0) => {
//   try {
//     const garages = await Garage.find().select('name address phone email ratingAverage');
//     const filteredGarages = garages.filter(garage => garage.ratingAverage >= minRating);
//
//     // Sort garages by ratingAverage in descending order
//     filteredGarages.sort((a, b) => b.ratingAverage - a.ratingAverage);
//
//     return filteredGarages;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };

// export const filterGaragesByRating = async (minRating = 0) => {
//   try {
//     const garages = await Garage.find().select(
//       "name address phone email ratingAverage"
//     );
//     const filteredGarages = garages.filter(
//       (garage) => garage.ratingAverage >= minRating
//     );
//     for (const garage of garages) {
//       const averageRating = (await calculateAverageRating(garage._id)) || 0;
//       garage.ratingAverage = averageRating;
//       await garage.save();
//     }
//     filteredGarages.sort((a, b) => b.ratingAverage - a.ratingAverage);

//     return filteredGarages;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };

// export const getFilteredGarages = async ({ rating, distance, availability, lat, lng }) => {
//   let query = {};

//   // Filter by rating (reputation)
//   if (rating) {
//       query.rating = { $gte: parseFloat(rating) };
//   }

//   // Filter by availability (đang mở cửa)
//   if (availability) {
//       const currentHour = new Date().getHours();
//       query.openingHours = { $lte: currentHour };
//       query.closingHours = { $gte: currentHour };
//   }

//   // Fetch garages từ database
//   let garages = await Garage.find(query);

//   // Filter by distance (sau khi lấy từ DB)
//   if (lat && lng) {
//       garages = garages
//           .map(garage => ({
//               ...garage._doc,
//               distance: calculateDistance(lat, lng, garage.location.lat, garage.location.lng)
//           }))
//           .filter(garage => !distance || garage.distance <= distance)
//           .sort((a, b) => a.distance - b.distance); // Sắp xếp theo khoảng cách tăng dần
//   }

//   // Ưu tiên garage pro (trong phạm vi nhất định)
//   const PRO_RANGE_KM = 20;
//   const proGarages = garages.filter(g => g.isPro && g.distance <= PRO_RANGE_KM);
//   const nonProGarages = garages.filter(g => !g.isPro || g.distance > PRO_RANGE_KM);

//   return [...proGarages, ...nonProGarages]; // Pro hiển thị trước trong phạm vi
// };

export const getCoordinatesFromAddress = async (address) => {
  try {
      const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address)}&format=json&limit=1`;
      const response = await axios.get(url, { headers: { "User-Agent": "DriveOn-App" } });

      if (response.data.length === 0) {
          throw new Error("Không tìm thấy tọa độ cho địa chỉ này.");
      }

      const { lat, lon } = response.data[0];
      return { latitude: parseFloat(lat), longitude: parseFloat(lon) };
  } catch (error) {
      throw new Error("Lỗi khi lấy tọa độ: " + error.message);
  }
};

// export const filterGaragesByDistance = (userLat, userLon, garages, maxDistance) => {
//   return garages.filter(garage => {
//       const [garageLon, garageLat] = garage.location.coordinates; // GeoJSON lưu (lon, lat)
//       const distance = haversineDistance(userLat, userLon, garageLat, garageLon);
//       return distance <= maxDistance; // Giữ lại garage nằm trong phạm vi
//   });
// };

// export const filterGaragesByDistance = (userLat, userLon, garages, maxDistance) => {
//   return garages
//       .map(garage => {
//           const [garageLon, garageLat] = garage.location.coordinates;
//           const distance = haversineDistance(userLat, userLon, garageLat, garageLon);

//           return {
//               ...garage.toObject(), // Chuyển từ Mongoose object sang plain object
//               distance, // Thêm khoảng cách vào object garage
//               isOpen: checkGarageOpen(garage.openingHours), // Kiểm tra trạng thái mở cửa
//           };
//       })
//       .filter(garage => garage.distance <= maxDistance) // Giữ lại garage trong phạm vi
//       .sort((a, b) => {
//           // 1️⃣ Garage đang mở cửa lên trước, đóng cửa đẩy xuống dưới
//           if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;
          
//           // 2️⃣ Garage Pro (trong phạm vi) được ưu tiên
//           if (a.isPro !== b.isPro) return b.isPro - a.isPro;

//           // 3️⃣ Sắp xếp theo rating (cao → thấp)
//           if (a.rating !== b.rating) return b.rating - a.rating;

//           // 4️⃣ Nếu rating bằng nhau, sắp xếp theo khoảng cách (gần → xa)
//           return a.distance - b.distance;
//       });
// };

// export const filterGaragesByDistance = (userLat, userLon, garages, maxDistance) => {
//   return garages
//       .map(garage => {
//           const [garageLon, garageLat] = garage.location.coordinates;
//           const distance = haversineDistance(userLat, userLon, garageLat, garageLon);
//           const isOpen = checkGarageOpen(garage.openTime, garage.closeTime, garage.operating_days);
//           const isPro = garage.isPro || false; // Giả sử có trường isPro trong DB

//           return {
//               ...garage.toObject(), // Chuyển từ Mongoose object sang plain object
//               distance, // Thêm khoảng cách
//               isOpen, // Trạng thái mở cửa
//               isPro // Trạng thái Pro
//           };
//       })
//       .filter(garage => garage.distance <= maxDistance) // Lọc garage trong phạm vi
//       .sort((a, b) => {
//           // 1️⃣ Garage đang mở cửa lên trước, đóng cửa đẩy xuống dưới
//           if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;

//           // 2️⃣ Garage Pro (trong phạm vi) được ưu tiên
//           if (a.isPro !== b.isPro) return b.isPro - a.isPro;

//           // 3️⃣ Sắp xếp theo rating (cao → thấp)
//           if (a.ratingAverage !== b.ratingAverage) return b.ratingAverage - a.ratingAverage;

//           // 4️⃣ Nếu rating bằng nhau, sắp xếp theo khoảng cách (gần → xa)
//           return a.distance - b.distance;
//       });
// };

// export const filterGaragesByDistance = (userLat, userLon, garages, maxDistance) => {
//   return garages
//       .map(garage => {
//           const [garageLon, garageLat] = garage.location.coordinates;
//           const distance = haversineDistance(userLat, userLon, garageLat, garageLon);

//           return {
//               ...garage.toObject(), // Chuyển từ Mongoose object sang plain object
//               distance, // Thêm khoảng cách vào object garage
//               isOpen: checkGarageOpen(garage.openingHours), // Kiểm tra trạng thái mở cửa
//               isPro: garage.tag === "pro" // Check nếu garage là Pro
//           };
//       })
//       .filter(garage => garage.distance <= maxDistance) // Chỉ giữ lại garage trong phạm vi tìm kiếm
//       .sort((a, b) => {
//           // 1️⃣ Garage đang mở cửa lên trước, đóng cửa đẩy xuống dưới
//           if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;
          
//           // 2️⃣ Garage Pro (trong phạm vi) được ưu tiên
//           if (a.isPro !== b.isPro) return b.isPro - a.isPro;

//           // 3️⃣ Sắp xếp theo rating (cao → thấp)
//           if (a.ratingAverage !== b.ratingAverage) return b.ratingAverage - a.ratingAverage;

//           // 4️⃣ Nếu rating bằng nhau, sắp xếp theo khoảng cách (gần → xa)
//           return a.distance - b.distance;
//       });
// };

export const filterGaragesByDistance = (userLat, userLon, garages, maxDistance) => {
  return garages
      .map(garage => {
          const [garageLon, garageLat] = garage.location.coordinates;
          const distance = haversineDistance(userLat, userLon, garageLat, garageLon);

          return {
              ...garage.toObject(), // Chuyển từ Mongoose object sang plain object
              distance, // Thêm khoảng cách vào object garage
              isOpen: checkGarageOpen(garage), // Kiểm tra trạng thái mở cửa
              isPro: garage.tag === "pro" // Kiểm tra nếu garage là Pro
          };
      })
      .filter(garage => garage.distance <= maxDistance) // Chỉ giữ lại garage trong phạm vi tìm kiếm
      .sort((a, b) => {
          // 1️⃣ Garage mở cửa trước, đóng cửa sau
          if (a.isOpen !== b.isOpen) return b.isOpen - a.isOpen;
          
          // 2️⃣ Garage Pro (trong phạm vi) được ưu tiên
          if (a.isPro !== b.isPro) return b.isPro - a.isPro;

          // 3️⃣ Sắp xếp theo rating cao → thấp
          if (a.ratingAverage !== b.ratingAverage) return b.ratingAverage - a.ratingAverage;

          // 4️⃣ Nếu rating bằng nhau, sắp xếp theo khoảng cách gần → xa
          return a.distance - b.distance;
      });
};

// Hàm kiểm tra garage có đang mở cửa không
// const checkGarageOpen = (openingHours) => {
//   const now = new Date();
//   const currentHour = now.getHours();
//   const currentMinute = now.getMinutes();
  
//   const today = now.getDay(); // Lấy thứ hiện tại (0: Chủ Nhật, 1: Thứ Hai, ... 6: Thứ Bảy)
//   const todayHours = openingHours[today]; // Lấy giờ mở cửa của hôm nay
  
//   if (!todayHours || !todayHours.open || !todayHours.close) return false; // Nếu không có thông tin, coi như đóng cửa
  
//   const [openHour, openMinute] = todayHours.open.split(":").map(Number);
//   const [closeHour, closeMinute] = todayHours.close.split(":").map(Number);
  
//   // So sánh giờ hiện tại với giờ mở cửa
//   return (
//       currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)
//   ) && (
//       currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute)
//   );
// };

// const checkGarageOpen = (openTime, closeTime, operatingDays) => {
//   const now = new Date();
//   const currentHour = now.getHours();
//   const currentMinute = now.getMinutes();
//   const currentDay = now.toLocaleString('en-US', { weekday: 'long' }); // Lấy thứ bằng tiếng Anh

//   // Nếu hôm nay garage không hoạt động
//   if (!operatingDays.includes(currentDay)) return false;

//   const [openHour, openMinute] = openTime.split(":").map(Number);
//   const [closeHour, closeMinute] = closeTime.split(":").map(Number);

//   return (
//       (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
//       (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute))
//   );
// };

// const checkGarageOpen = (garage) => {
//   if (!garage.openTime || !garage.closeTime || !garage.operating_days) {
//       return false; // Nếu thiếu dữ liệu, mặc định là đóng cửa
//   }

//   const now = new Date();
//   const currentHour = now.getHours();
//   const currentMinute = now.getMinutes();
  
//   const todayIndex = now.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
//   const daysMapping = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
//   const today = daysMapping[todayIndex];

//   // Kiểm tra nếu hôm nay có trong danh sách hoạt động của garage
//   if (!garage.operating_days.includes(today)) {
//       return false;
//   }

//   // Chuyển đổi giờ mở cửa & đóng cửa từ string -> số
//   const [openHour, openMinute] = garage.openTime.split(":").map(Number);
//   const [closeHour, closeMinute] = garage.closeTime.split(":").map(Number);

//   // Kiểm tra xem giờ hiện tại có nằm trong khoảng mở cửa không
//   return (
//       (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
//       (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute))
//   );
// };

const checkGarageOpen = (garage) => {
  if (!garage.openTime || !garage.closeTime || !garage.operating_days) {
      return false; // Nếu thiếu dữ liệu, mặc định đóng cửa
  }

  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  
  const todayIndex = now.getDay(); // 0: Chủ Nhật, 1: Thứ Hai, ..., 6: Thứ Bảy
  const daysMapping = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const today = daysMapping[todayIndex];

  // Kiểm tra nếu hôm nay có trong danh sách hoạt động của garage
  if (!garage.operating_days.includes(today)) {
      return false;
  }

  // Chuyển đổi giờ mở cửa & đóng cửa từ string -> số
  const [openHour, openMinute] = garage.openTime.split(":").map(Number);
  const [closeHour, closeMinute] = garage.closeTime.split(":").map(Number);

  // Kiểm tra xem giờ hiện tại có nằm trong khoảng mở cửa không
  return (
      (currentHour > openHour || (currentHour === openHour && currentMinute >= openMinute)) &&
      (currentHour < closeHour || (currentHour === closeHour && currentMinute < closeMinute))
  );
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
};
