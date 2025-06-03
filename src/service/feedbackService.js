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

export const getFeedbackByGarageId = async ({
  id,
  type,
  rating,
  service,
  keyword,
  page = 1,
  limit = 10,
}) => {
  try {
    // Validate page and limit parameters
    page = parseInt(page);
    limit = parseInt(limit);
    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1) limit = 10;

    // Build the query with garage ID as base
    const query = { garage: id };

    // Add filters if they are provided
    if (type) {
      query.type = type;
    }

    if (rating) {
      query.rating = parseInt(rating);
    }

    if (service) {
      query.serviceDetail = service;
    }

    // For keyword search in content
    if (keyword) {
      query.$or = [
        { content: { $regex: keyword, $options: "i" } },
        { "user.name": { $regex: keyword, $options: "i" } },
      ];
    }

    // Calculate skip value for pagination
    const skip = (page - 1) * limit;

    // Get total count for pagination metadata using the same query
    const totalCount = await Feedback.countDocuments(query);

    // Get paginated and filtered feedbacks
    const feedbacks = await Feedback.find(query)
      .populate("user", "name avatar")
      .populate({
        path: "appointment",
        select: "start end service vehicle",
        populate: [
          { path: "service", select: "name" },
          { path: "vehicle", select: "carName carPlate" },
        ],
      })
      .populate("serviceDetail")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Calculate pagination metadata
    const totalPages = Math.ceil(totalCount / limit);

    return {
      feedbacks,
      pagination: {
        currentPage: page,
        totalPages,
        pageSize: limit,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    };
  } catch (err) {
    throw new Error(err.message);
  }
};

export const viewFeedbackForGarageDetail = async (
  garageId,
  showMoreCount = 1
) => {
  const perPage = 5;
  const limit = perPage * showMoreCount;

  try {
    const totalGeneral = await Feedback.countDocuments({
      garage: garageId,
      type: "general",
    });

    const totalSpecific = await Feedback.countDocuments({
      garage: garageId,
      type: "specific",
    });

    const totalFeedback = totalGeneral + totalSpecific;

    const generalFeedbacks = await Feedback.find({
      garage: garageId,
      type: "general",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "name avatar")
      .populate({
        path: "appointment",
        select: "start end service vehicle",
        populate: [{ path: "service", select: "name" }],
      });

    const transformedFeedbacks = generalFeedbacks.map((feedback) => {
      const feedbackObj = feedback.toObject();

      let serviceNames = "";
      if (feedbackObj.appointment && feedbackObj.appointment.service) {
        serviceNames = feedbackObj.appointment.service
          .map((service) => service.name)
          .join(", ");
      }

      feedbackObj.serviceNames = serviceNames;
      delete feedbackObj.appointment;

      return feedbackObj;
    });

    const specificFeedbacks = await Feedback.find({
      garage: garageId,
      type: "specific",
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("user", "name avatar")
      .populate("serviceDetail", "name price duration");

    const transformedFeedbacksSpecific = specificFeedbacks.map((feedback) => {
      const feedbackObj = feedback.toObject();

      let serviceName = "";
      if (feedbackObj.serviceDetail && feedbackObj.serviceDetail.name) {
        serviceName = feedbackObj.serviceDetail.name;
      }

      feedbackObj.serviceName = serviceName;
      delete feedbackObj.appointment;
      delete feedbackObj.serviceDetail;

      return feedbackObj;
    });

    const combined = [...transformedFeedbacks, ...transformedFeedbacksSpecific]
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)) // đảm bảo sắp xếp chung
      .slice(0, limit);

    const canShowMore = combined.length < totalFeedback ? true : false;

    return {
      feedbacks: combined,
      canShowMore,
    };
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

export const getFeedbackByServiceDetailInGarage = async (serviceDetailId) => {
  try {
    const feedbacks = await Feedback.find({
      serviceDetail: serviceDetailId,
      type: "specific",
    })
      .populate("user", "name avatar")
      .populate("serviceDetail", "name price duration")
      .populate({
        path: "appointment",
        select: "start end service vehicle",
        populate: [{ path: "service", select: "name" }],
      });

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

// export const getAllFeedbacksByGarage = async (garageId) => {
//   try {
//     const feedbacks = await Feedback.find({ garage: garageId })
//       .populate("user", "name avatar")
//       .populate({
//         path: "appointment",
//         select: "start end service vehicle",
//         populate: [
//           { path: "service", select: "name" },
//           { path: "vehicle", select: "carName carPlate" },
//         ],
//       })
//       .populate("serviceDetail");
//     return feedbacks;
//   } catch (err) {
//     throw new Error(err.message);
//   }
// };

export const getAllFeedbacksByGarage = async (garageId, year, quarter) => {
  try {
    const query = { garage: garageId };

    // Filter theo năm và quý nếu có
    if (year) {
      const selectedYear = parseInt(year);
      let startDate = new Date(selectedYear, 0, 1);
      let endDate = new Date(selectedYear + 1, 0, 1);

      if (quarter) {
        const q = parseInt(quarter);
        startDate = new Date(selectedYear, (q - 1) * 3, 1);
        endDate = new Date(selectedYear, q * 3, 1);
      }
      query.createdAt = { $gte: startDate, $lt: endDate };
    }

    const feedbacks = await Feedback.find(query)
      .populate("user", "name avatar")
      .populate({
        path: "appointment",
        select: "start end service vehicle",
        populate: [
          { path: "service", select: "name" },
          { path: "vehicle", select: "carName carPlate" },
        ],
      })
      .populate("serviceDetail");
    return feedbacks;
  } catch (err) {
    throw new Error(err.message);
  }
};