import Feedback from '../models/feedback.js';
import Garage from '../models/garage.js';
import Service from '../models/service.js';
import { validateAddFeedback, validateUpdateFeedback } from "../validator/feedbackValidator.js";

export const addFeedback = async (userId, feedbackData) => {
    validateAddFeedback(feedbackData);

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
        }
    }

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

    // rating trung bình cho garage
    const feedbacks = await Feedback.find({ garage });

    const averageRating =
        feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
        feedbacks.length || 0;

    garageExists.ratingAverage = Math.round(averageRating * 10) / 10;
    await garageExists.save();

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
    validateUpdateFeedback(updateData);
    const { rating, text } = updateData;

    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
        throw new Error("Feedback not found");
    }

    if (feedback.user.toString() !== userId) {
        throw new Error("Unauthorized");
    }
    feedback.rating = rating !== undefined ? rating : feedback.rating;
    feedback.text = text !== undefined ? text : feedback.text;
    feedback.updatedAt = new Date();

    await feedback.save();

    // Cập nhật rating trung bình cho garage
    const feedbacks = await Feedback.find({ garage: feedback.garage });
    const averageRating =
        feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
        feedbacks.length || 0;

    const garage = await Garage.findById(feedback.garage);
    if (garage) {
        garage.ratingAverage = Math.round(averageRating * 10) / 10;
        await garage.save();
    }

    return feedback;
};


export const deleteFeedback = async (userId, feedbackId) => {
    const feedback = await Feedback.findById(feedbackId);
    if (!feedback) {
        throw new Error("Feedback not found");
    }

    if (feedback.user.toString() !== userId) {
        throw new Error("Unauthorized");
    }

    const garageId = feedback.garage; 
    await feedback.deleteOne();

    // Cập nhật lại rating trung bình cho garage
    const feedbacks = await Feedback.find({ garage: garageId });
    const averageRating =
        feedbacks.length > 0
            ? feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) / feedbacks.length
            : 0; // Nếu không còn feedback nào, averageRating sẽ trả lại 0

    const garage = await Garage.findById(garageId);
    if (garage) {
        garage.ratingAverage = Math.round(averageRating * 10) / 10;
        await garage.save();
    }

    return { message: "Feedback deleted successfully" };
};