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

export { addServiceDetail };