import * as feedbackService from "../service/feedbackService.js";

export const viewFeedbackByGarageId = async (req, res) => {
  const { id } = req.params;
  const { type, rating, service, keyword } = req.query; // garage id
  try {
    const feedbacks = await feedbackService.getFeedbackByGarageId({
      id,
      type,
      rating,
      service,
      keyword,
    });
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const viewFeedbackForGarageDetail = async (req, res) => {
  const { garageId } = req.params; // garage id
  try {
    const feedbacks = await feedbackService.viewFeedbackForGarageDetail(
      garageId
    );
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addFeedback = async (req, res) => {
  const userId = req.user.id;
  try {
    const newFeedback = await feedbackService.addFeedback(userId, req.body);
    res.status(201).json({
      message: "Feedback added successfully",
      feedback: newFeedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const updateFeedback = async (req, res) => {
  const userId = req.user.id;
  const { appointmentId } = req.params; // feedback ID
  try {
    const updatedFeedback = await feedbackService.updateFeedback(
      userId,
      appointmentId,
      req.body
    );
    res.status(200).json({
      message: "Feedback updated successfully",
      feedback: updatedFeedback,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFeedback = async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params; // feedback ID
  try {
    const result = await feedbackService.deleteFeedback(userId, id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const deleteFeedbackByGarage = async (req, res) => {
  const { id } = req.params; // garage ID
  try {
    const result = await feedbackService.deleteFeedbackByGarage(id);
    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const viewFeedbackByServiceDetailInGarage = async (req, res) => {
  const { serviceDetailId } = req.params;
  try {
    const feedbacks = await feedbackService.getFeedbackByServiceDetailInGarage(
      serviceDetailId
    );
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const addMultiFeedback = async (req, res) => {
  try {
    const results = await feedbackService.addFeedback(req.user.id, req.body);
    res.status(200).json(results);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

export const getFeedbackByAppointmentId = async (req, res) => {
  const { appointmentId } = req.params;
  try {
    const feedbacks = await feedbackService.getFeedbackByAppointmentId(
      appointmentId
    );
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// export const getAllFeedbacksByGarage = async (req, res) => {
//   const { id } = req.params; // garage id
//   try {
//     const feedbacks = await feedbackService.getAllFeedbacksByGarage(id);
//     res.status(200).json(feedbacks);
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// };

export const getAllFeedbacksByGarage = async (req, res) => {
  const { id } = req.params; // garage id
  const { year, quarter } = req.query;
  try {
    const feedbacks = await feedbackService.getAllFeedbacksByGarage(id, year, quarter);
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};