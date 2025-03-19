import Feedback from '../models/feedback.js';
import Garage from '../models/garage.js';
import Service from '../models/service.js';

export const addFeedback = async (userId, feedbackData) => {
    const { garage, rating, text, service } = feedbackData;

    // Check xem garage ni có exist ko
    const garageExists = await Garage.findById(garage);
    if (!garageExists) {
        throw new Error("Garage ID does not exist");
    }

    // check service system có exist ko
    if (service) {
    const serviceExists = await Service.findById(service);
    if (!serviceExists) {
        throw new Error("Service ID does not exist");
    }}

    const newFeedback = new Feedback({
        user: userId,
        garage,
        rating,
        text,
        service,
        createdAt: new Date(),
        updatedAt: new Date(),
    });

    await newFeedback.save();
    return newFeedback;
};


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


export const updateFeedback = async (userId, feedbackId, updateData) => {
    const { rating, text } = updateData;

    // Tìm feedback theo ID
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
        throw new Error("Feedback not found");
    }

    // Kiểm tra quyền sở hữu feedback
    if (feedback.user.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    // Cập nhật các trường
    feedback.rating = rating !== undefined ? rating : feedback.rating;
    feedback.text = text !== undefined ? text : feedback.text;
    feedback.updatedAt = new Date();

    // Lưu feedback đã cập nhật
    await feedback.save();
    return feedback;
};