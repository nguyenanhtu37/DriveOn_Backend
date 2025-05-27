import * as cozeService from "../service/cozeService.js";

export const getServices = async (req, res) => {
  try {
    const keyword = req.query.keyword || "";
    const services = await cozeService.fetchServices(keyword);
    return res.status(200).json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return res.status(500).json({ message: "Failed to fetch services." });
  }
};

export const searchServices = async (req, res) => {
  try {
    let { name, location } = req.query;

    if (!name) {
      return res.status(400).json({ message: "Keyword is required" });
    }

    // 🔍 Extract keyword từ mô tả người dùng
    const refinedKeyword = cozeService.extractKeyword(name);
    console.log("Extracted keyword:", refinedKeyword);

    const services = await cozeService.searchServices(refinedKeyword, location);
    res.status(200).json({ services });
  } catch (error) {
    console.error("Error searching services:", error);
    res.status(500).json({ message: "Failed to search services" });
  }
};
