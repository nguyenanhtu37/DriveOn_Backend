import * as feedbackService from "../service/feedbackService.js";

export const viewFeedbackByGarageId = async (req, res) => {
  const { id } = req.params; // garage id
  try {
    const feedbacks = await feedbackService.getFeedbackByGarageId(id);
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
  const { id } = req.params; // feedback ID
  try {
    const updatedFeedback = await feedbackService.updateFeedback(
      userId,
      id,
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
  const { garageId, serviceDetailId } = req.params;
  try {
    const feedbacks = await feedbackService.getFeedbackByServiceDetailInGarage(
      garageId,
      serviceDetailId
    );
    res.status(200).json(feedbacks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
