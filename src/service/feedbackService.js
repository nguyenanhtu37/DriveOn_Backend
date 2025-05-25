import Appointment from "../models/appointment.js";
import Feedback from "../models/feedback.js";
import Garage from "../models/garage.js";
import Service from "../models/service.js";
import {
  validateAddFeedback,
  validateUpdateFeedback,
} from "../validator/feedbackValidator.js";

// export const addFeedback = async (userId, feedbackData) => {
//   validateAddFeedback(feedbackData);

//   const { garage, rating, content, appointment, serviceDetail } = feedbackData;

//   const appointmentData = await Appointment.findById(appointment);
//   if (!appointmentData) throw new Error("Appointment not found");
//   if (appointmentData.user.toString() !== userId)
//     throw new Error("You are not authorized to provide feedback for this appointment");
//   if (appointmentData.status !== "Completed")
//     throw new Error("You can only provide feedback for completed appointments");

//   const garageExists = await Garage.findById(garage);
//   if (!garageExists) throw new Error("Garage ID does not exist");

//   if (!appointmentData.service.map(id => id.toString()).includes(serviceDetail))
//     throw new Error("This service was not used in the appointment");

//   // Kiểm tra đã feedback ch (mỗi carowner chỉ feedback 1 lần cho 1 service trong 1 appointment)
//   const existed = await Feedback.findOne({ user: userId, appointment, serviceDetail });
//   if (existed) throw new Error("You have already given feedback for this service in this appointment");

//   const newFeedback = new Feedback({
//     user: userId,
//     garage,
//     rating,
//     content,
//     appointment,
//     serviceDetail,
//     createdAt: new Date(),
//     updatedAt: new Date(),
//   });

//   await newFeedback.save();

//   // Cập nhật rating trung bình cho garage
//   const feedbacks = await Feedback.find({ garage });
//   const averageRating =
//     feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) / (feedbacks.length || 1);

//   garageExists.ratingAverage = Math.round(averageRating * 10) / 10;
//   await garageExists.save();

//   return newFeedback;
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

export const viewFeedbackForGarageDetail = async (garageId) => {
  try {
    const feedbacks = await Feedback.find({ garage: garageId, type: "general" })
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

export const updateFeedback = async (userId, appointmentId, updateData) => {
  const feedbacks = await Feedback.find({ appointment: appointmentId });
  if (feedbacks.length === 0) {
    throw new Error("No feedback found for this appointment");
  }
  // remove feedback
  for (const feedback of feedbacks) {
    await feedback.deleteOne();
  }

  return await addFeedback(userId, updateData);
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

// xem được toàn bộ feedback về service đó
export const getFeedbackByServiceDetailInGarage = async (
  garageId,
  serviceDetailId
) => {
  try {
    const feedbacks = await Feedback.find({
      garage: garageId,
      serviceDetail: serviceDetailId,
      type: "specific",
    })
      .populate("user", "name avatar")
      .populate("appointment", "start end")
      .populate("serviceDetail", "name price duration");

    return feedbacks;
  } catch (err) {
    throw new Error(err.message);
  }
};

export const addFeedback = async (userId, feedbackData) => {
  const { type, garage, appointment, specific, rating, content } = feedbackData;

  // Ktra appointment
  const appointmentData = await Appointment.findById(appointment);
  if (!appointmentData) throw new Error("Appointment not found");
  if (appointmentData.user.toString() !== userId)
    throw new Error(
      "You are not authorized to provide feedback for this appointment"
    );
  if (appointmentData.status !== "Completed")
    throw new Error("You can only provide feedback for completed appointments");

  // Ktra garage
  const garageExists = await Garage.findById(garage);
  if (!garageExists) throw new Error("Garage ID does not exist");

  // Lấy danh sách serviceId hợp lệ trong appointment
  // const validServiceIds = appointmentData.service.map((id) => id.toString());

  if (type === "general") {
    const newFeedback = new Feedback({
      user: userId,
      garage,
      rating,
      content,
      appointment,
      type: "general",
    });
    await newFeedback.save();
  } else if (type === "specific") {
    for (const item of specific) {
      const { service, content, rating } = item;

      const newFeedback = new Feedback({
        type: "specific",
        user: userId,
        garage,
        rating,
        content,
        appointment,
        serviceDetail: service,
      });
      await newFeedback.save();
    }
  }

  await Appointment.findByIdAndUpdate(
    appointment,
    {
      isFeedbacked: true,
    },
    { new: true }
  );

  // Cập nhật rating trung bình cho garage
  const feedbacks = await Feedback.find({ garage });
  const averageRating =
    feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) /
    (feedbacks.length || 1);

  garageExists.ratingAverage = Math.round(averageRating * 10) / 10;
  await garageExists.save();
};

export const getFeedbackByAppointmentId = async (appointmentId) => {
  try {
    const feedbacks = await Feedback.find({ appointment: appointmentId });
    return feedbacks;
  } catch (error) {
    throw new Error("Error fetching feedbacks for the appointment");
  }
};
