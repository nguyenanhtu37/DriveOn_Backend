import * as serviceDetailService from "../service/serviceDetailService.js";

const addServiceDetail = async (req, res) => {
  try {
    const newServiceDetail = await serviceDetailService.addServiceDetail(req.body);
    res.status(201).json({
      message: "Service detail added successfully",
      serviceDetail: newServiceDetail,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getServiceDetailsByGarage = async (req, res) => {
    const { garageId } = req.params;
    try {
      const serviceDetails = await serviceDetailService.getServiceDetailsByGarage(garageId);
      res.status(200).json(serviceDetails);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

const updateServiceDetail = async (req, res) => {
    const { id } = req.params;
    try {
      const updatedServiceDetail = await serviceDetailService.updateServiceDetail(id, req.body);
      res.status(200).json({
        message: "Service detail updated successfully",
        serviceDetail: updatedServiceDetail,
      });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
};

export { addServiceDetail, getServiceDetailsByGarage, updateServiceDetail };