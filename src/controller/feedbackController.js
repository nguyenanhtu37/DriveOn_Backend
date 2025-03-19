import * as feedbackService from '../service/feedbackService.js';

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
    const userId = req.user.id; // Lấy userId từ middleware xác thực
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