import * as serviceDetailService from "../service/serviceDetailService.js";

const addServiceDetail = async (req, res) => {
  try {
    const newServiceDetail = await serviceDetailService.addServiceDetail(
      req.body
    );
    res.status(201).json({
      message: "Service detail added successfully",
      serviceDetail: newServiceDetail,
    });
  } catch (err) {
    console.log("Error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getServiceDetailsByGarage = async (req, res) => {
  const { garageId } = req.params;
  try {
    const serviceDetails = await serviceDetailService.getServiceDetailsByGarage(
      garageId
    );
    res.status(200).json(serviceDetails);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateServiceDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const updatedServiceDetail = await serviceDetailService.updateServiceDetail(
      id,
      req.body
    );
    res.status(200).json({
      message: "Service detail updated successfully",
      serviceDetail: updatedServiceDetail,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteServiceDetail = async (req, res) => {
  const { id } = req.params;
  try {
    const result = await serviceDetailService.deleteServiceDetail(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
export const getServiceDetailById = async (req, res) => {
  const { id } = req.params;
  try {
    const serviceDetail = await serviceDetailService.getServiceDetailById(id);
    if (!serviceDetail) {
      return res.status(404).json({ message: "Service detail not found" });
    }
    res.status(200).json(serviceDetail);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchServices = async (req, res) => {
  try {
    const { name, location } = req.query;

    if (!name) {
      return res.status(400).json({ error: "Keyword is required" });
    }

    const services = await serviceDetailService.searchServices(name, location);
    // console.log("Services returned to controller:", services);
    res.status(200).json({ services });
  } catch (error) {
    console.error("Error searching services:", error);
    res.status(500).json({ error: "Failed to search services" });
  }
};

export const getEmergency = async (req, res) => {
  try {
    const { latitude, longitude } = req.query;

    if (!latitude || !longitude) {
      return res
        .status(400)
        .json({ error: "Latitude and longitude are required" });
    }

    const emergencyGarages = await serviceDetailService.getEmergency(
      latitude,
      longitude
    );

    res.status(200).json({ emergencyGarages });
  } catch (error) {
    console.error("Error in getEmergency controller:", error);
    res.status(500).json({ error: "Failed to get emergency garages" });
  }
};

export const getServiceUsageCounts = async (req, res) => {
  try {
    const serviceUsageCounts =
      await serviceDetailService.getServiceUsageCounts();
    res.status(200).json(serviceUsageCounts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const searchServicesByKeyword = async (req, res) => {
  try {
    const { keyword, lat, lon } = req.query;

    const services = await serviceDetailService.searchServiceKeyword({
      keyword,
      lat,
      lon,
    });
    res.status(200).json(services);
  } catch (error) {
    console.error("Error searching services by keyword:", error);
    res.status(500).json({ error: "Failed to search services by keyword" });
  }
};

export const softDeleteServiceDetail = async (req, res) => {
  const { id } = req.params; // Lấy serviceDetailId từ URL
  try {
    const result = await serviceDetailService.softDeleteServiceDetail(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export {
  addServiceDetail,
  getServiceDetailsByGarage,
  updateServiceDetail,
  deleteServiceDetail,
};
