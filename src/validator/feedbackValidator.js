import { z } from "zod";

const feedbackSchema = z.object({
  garage: z.string().nonempty("Garage ID is required"),
  rating: z
    .number()
    .min(1, "Rating must be at least 1")
    .max(5, "Rating must be at most 5"),
  content: z.string().optional(),
  appointment: z.string().nonempty("Appointment ID is required"),
  serviceDetail: z.string().nonempty("ServiceDetail ID is required"),
});

export const validateAddFeedback = (feedbackData) => {
  try {
    feedbackSchema.parse(feedbackData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};

const updateFeedbackSchema = feedbackSchema.partial(); // Tất cả các trường đều là optional

export const validateUpdateFeedback = (feedbackData) => {
  try {
    updateFeedbackSchema.parse(feedbackData);
  } catch (e) {
    throw new Error(e.errors.map((err) => err.message).join(", "));
  }
};
