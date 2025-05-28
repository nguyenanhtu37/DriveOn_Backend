import express from "express";
import {
  addFeedback,
  viewFeedbackByGarageId,
  updateFeedback,
  deleteFeedback,
  deleteFeedbackByGarage,
  viewFeedbackByServiceDetailInGarage,
  addMultiFeedback,
  viewFeedbackForGarageDetail,
  getFeedbackByAppointmentId,
} from "../controller/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// router.post("/add", authMiddleware, addFeedback);
router.post("/add", authMiddleware, addMultiFeedback); // add feedback
router.get("/garage/:id", viewFeedbackByGarageId);
router.get("/appointment/:appointmentId", getFeedbackByAppointmentId);
router.put("/appointment/:appointmentId", authMiddleware, updateFeedback);
router.delete("/:id", authMiddleware, deleteFeedback);
router.delete(
  "/delete/:id",
  authorizeRoles(["staff", "manager"]),
  deleteFeedbackByGarage
);
router.get("/service/:serviceDetailId", viewFeedbackByServiceDetailInGarage);

router.get("/garageDetail/:garageId", viewFeedbackForGarageDetail);

export default router;
