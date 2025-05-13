import Appointment from "../models/appointment.js";
import Feedback from "../models/feedback.js";
import Garage from "../models/garage.js";
import Service from "../models/service.js";
import {
  validateAddFeedback,
  validateUpdateFeedback,
} from "../validator/feedbackValidator.js";

export const addFeedback = async (userId, feedbackData) => {
  validateAddFeedback(feedbackData);

  const { garage, rating, content, appointment } = feedbackData;

  const appointmentData = await Appointment.findById(appointment);
  if (!appointmentData) {
    throw new Error("Appointment not found");
  }

  if (appointmentData.user.toString() !== userId) {
    throw new Error("You are not authorized to provide feedback for this appointment");
  }

  if (appointmentData.status !== "Completed") {
    throw new Error("You can only provide feedback for completed appointments");
  }

  const garageExists = await Garage.findById(garage);
  if (!garageExists) {
    throw new Error("Garage ID does not exist");
  }

  const newFeedback = new Feedback({
    user: userId,
    garage,
    rating,
    content,
    appointment,
    createdAt: new Date(),
    updatedAt: new Date(),
  });

  await newFeedback.save();

  // Cập nhật rating trung bình cho garage
  const feedbacks = await Feedback.find({ garage });
  const averageRating =
    feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
      feedbacks.length || 0;

  garageExists.ratingAverage = Math.round(averageRating * 10) / 10;
  await garageExists.save();

  return newFeedback;
};

// export const getFeedbackByGarageId = async (garageId) => {
//   try {
//     const feedbacks = await Feedback.find({ garage: garageId })
//       .populate("user", "name avatar")
//       .populate("garage", "name");
//     return feedbacks;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };

export const getFeedbackByGarageId = async (garageId) => {
  try {
    const feedbacks = await Feedback.find({ garage: garageId })
      .populate("user", "name avatar") 
      // .populate("garage", "name")
      .populate({
        path: "appointment", 
        select: "start end service vehicle", 
        populate: [
          { path: "service", select: "name" }, 
          { path: "vehicle", select: "carName carPlate" }, 
        ],
      });

    return feedbacks;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const updateFeedback = async (userId, feedbackId, updateData) => {
  validateUpdateFeedback(updateData);
  const { rating, content } = updateData;

  // Tìm feedback theo ID
  const feedback = await Feedback.findById(feedbackId).populate("appointment");
  if (!feedback) {
    throw new Error("Feedback not found");
  }

  if (feedback.user.toString() !== userId) {
    throw new Error("Unauthorized");
  }

  if (feedback.appointment.status !== "Completed") {
    throw new Error("You can only update feedback for completed appointments");
  }

  feedback.rating = rating !== undefined ? rating : feedback.rating;
  feedback.content = content !== undefined ? content : feedback.content;
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

  const feedbacks = await Feedback.find({ garage: garageId });
  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
        feedbacks.length
      : 0;

  const garage = await Garage.findById(garageId);
  if (garage) {
    garage.ratingAverage = Math.round(averageRating * 10) / 10;
    await garage.save();
  }

  return { message: "Feedback deleted successfully" };
};

export const deleteFeedbackByGarage = async (feedbackId) => {
  console.log(feedbackId);

  const feedback = await Feedback.findById(feedbackId);
  if (!feedback) {
    throw new Error("Feedback not found");
  }

  let feedbacks = await Feedback.find({ garage: feedback.garage });

  if (feedbacks.length === 0) {
    throw new Error("No feedbacks found for this garage");
  }

  await feedback.deleteOne();

  feedbacks = feedbacks.filter((fb) => fb.id !== feedbackId);

  const averageRating =
    feedbacks.length > 0
      ? feedbacks.reduce((acc, fb) => acc + fb.rating, 0) / feedbacks.length
      : 0;

  const garage = await Garage.findById(feedback.garage);
  if (garage) {
    garage.ratingAverage = Math.round(averageRating * 10) / 10;
    await garage.save();
  }
};
