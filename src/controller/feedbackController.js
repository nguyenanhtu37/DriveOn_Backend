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