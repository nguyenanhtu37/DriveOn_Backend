import nlp from 'compromise';
import ServiceDetail from "../models/serviceDetail.js";
import Garage from "../models/garage.js";

export const fetchServices = async (keyword = "") => {
  const query = {
    isDeleted: false,
    $or: [
      { name: { $regex: keyword, $options: "i" } },
      { description: { $regex: keyword, $options: "i" } },
    ],
  };

  return await ServiceDetail.find(query)
    .populate("garage", "name address")
    .populate("service", "name")
    .lean();
};

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

// extract keyword function
const keywordMap = {
  // Thay nhớt / dầu
  "chảy nhớt": "Thay nhớt",
  "hết nhớt": "Thay nhớt",
  "thay nhớt": "Thay nhớt",
  "thay dầu nhớt động cơ": "Thay dầu nhớt động cơ",
  "thay dầu động cơ": "Thay dầu động cơ",
  "thay dầu động cơ & lọc dầu": "Thay dầu động cơ & lọc dầu",

  // Cứu hộ
  "cứu hộ": "Cứu hộ",
  "cần cứu hộ": "Cứu hộ",
  "hết xăng giữa đường": "Hỗ trợ cứu hộ khẩn cấp",
  "xe chết máy": "Dịch vụ cứu hộ xe khẩn cấp",
  "hỗ trợ cứu hộ khẩn cấp": "Hỗ trợ cứu hộ khẩn cấp",

  // Sửa điều hòa
  "điều hòa không mát": "Sửa điều hòa",
  "điều hòa hỏng": "Sửa điều hòa",
  "điều hòa yếu": "Sửa điều hòa",
  "sửa điều hòa": "Sửa điều hòa",

  // Phanh
  "kẹt phanh": "Kiểm tra và sửa chữa phanh",
  "phanh bị kẹt": "Kiểm tra và sửa chữa phanh",
  "phanh hỏng": "Kiểm tra và sửa chữa phanh",
  "phanh yếu": "Kiểm tra hệ thống phanh",
  "phanh kêu": "Bảo dưỡng, thay phanh",
  "kiểm tra phanh": "Kiểm tra và sửa chữa phanh",
  "thay dầu phanh": "Thay dầu phanh",

  // Ắc quy
  "ắc quy yếu": "Kiểm tra và thay thế ắc quy",
  "không đề được": "Kiểm tra và thay thế ắc quy",
  "thay ắc quy ô tô": "Thay ắc quy ô tô",
  "kiểm tra ắc quy": "Kiểm tra và thay thế ắc quy",
  "ắc quy hết điện": "Kiểm tra và thay thế ắc quy",

  // Dịch vụ chẩn đoán
  "máy nóng": "Dịch vụ chẩn đoán",
  "động cơ kêu": "Dịch vụ chẩn đoán",
  "động cơ yếu": "Dịch vụ chẩn đoán",

  // Cân bằng bánh xe
  "lốp lệch": "Cân bằng bánh xe",
  "bánh xe rung": "Cân bằng bánh xe",
  "cân bằng bánh xe": "Cân bằng bánh xe",
  "cân bằng động": "Thay lốp & cân bằng động",
  "xoay lốp và cân bằng góc bánh xe": "Xoay lốp và cân bằng góc bánh xe",

  // Hộp số
  "hộp số trượt": "Dịch vụ bảo dưỡng hộp số",
  "hộp số kêu": "Xả dầu hộp số",
  "xả dầu hộp số": "Xả dầu hộp số",
  "dịch vụ bảo dưỡng hộp số": "Dịch vụ bảo dưỡng hộp số",

  // Hệ thống treo
  "xe xóc": "Sửa chữa hệ thống treo",
  "gầm kêu": "Sửa chữa hệ thống treo",
  "sửa chữa hệ thống treo": "Sửa chữa hệ thống treo",
  "kiểm tra hệ thống lái – treo": "Kiểm tra và căn chỉnh hệ thống lái – treo",

  // Thay vòng bi bánh xe
  "thay vòng bi bánh xe": "Thay vòng bi bánh xe",
  "vòng bi kêu": "Thay vòng bi bánh xe",

  // Kính chắn gió
  "nứt kính": "Sửa chữa và thay thế kính chắn gió",
  "vỡ kính": "Sửa chữa và thay thế kính chắn gió",
  "thay kính chắn gió": "Sửa chữa và thay thế kính chắn gió",

  // Nội thất
  "xe bẩn": "Dọn nội thất và vệ sinh xe",
  "vệ sinh nội thất": "Dịch vụ vệ sinh nội thất",
  "dọn nội thất và vệ sinh xe": "Dọn nội thất và vệ sinh xe",
  "khử mùi nội thất": "Khử mùi & diệt khuẩn nội thất",
  "diệt khuẩn nội thất": "Khử mùi & diệt khuẩn nội thất",
  "vệ sinh và phục hồi nội thất": "Vệ sinh và phục hồi nội thất toàn diện",

  // Đánh bóng & phủ bảo vệ sơn
  "xe bị trầy xước": "Đánh bóng & phủ bảo vệ sơn xe",
  "đánh bóng sơn": "Đánh bóng & phủ bảo vệ sơn xe",
  "phủ bảo vệ sơn": "Đánh bóng & phủ bảo vệ sơn xe",

  // Kiểm tra tổng quát
  "muốn bảo dưỡng": "Kiểm tra tổng quát tình trạng xe",
  "kiểm tra tổng quát": "Kiểm tra tổng quát tình trạng xe",
  "bảo dưỡng xe": "Kiểm tra tổng quát tình trạng xe",

  // Dây curoa cam
  "thay dây curoa cam": "Thay dây curoa cam",
  "dây curoa hỏng": "Thay dây curoa cam",

  // Thay lốp
  "lốp xì hơi": "Thay lốp & cân bằng động",
  "thay lốp": "Thay lốp & cân bằng động",
  "lốp mòn": "Bảo dưỡng, thay lốp xe",
  "bảo dưỡng thay lốp": "Bảo dưỡng, thay lốp xe",

  // Rửa xe
  "rửa xe": "Rửa xe",
  "rửa sạch xe": "Rửa xe",
};

export const extractKeyword = (description) => {
  const lowerDesc = description.toLowerCase().trim();

  // Exact match
  if (keywordMap[lowerDesc]) return keywordMap[lowerDesc];

  // Loose match: find in description
  for (const [phrase, keyword] of Object.entries(keywordMap)) {
    if (lowerDesc.includes(phrase)) {
      return keyword;
    }
  }

  // NLP fallback (optional)
  const doc = nlp(lowerDesc);
  const nouns = doc.nouns().out('array');
  if (nouns.length > 0) return nouns[0];

  // Fallback to full input
  return description;
};