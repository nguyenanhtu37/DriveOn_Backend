import Feedback from '../models/feedback.js';

export const getFeedbackByGarageId = async (garageId) => {
    try {
        const feedbacks = await Feedback.find({ garage: garageId })
            .populate('user', 'name')
            .populate('garage', 'name');
        return feedbacks;
    } catch (err) {
        throw new Error(err.message);
    }
};