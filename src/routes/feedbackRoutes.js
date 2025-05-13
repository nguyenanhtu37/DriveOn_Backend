import express from "express";
import {
  addFeedback,
  viewFeedbackByGarageId,
  updateFeedback,
  deleteFeedback,
  deleteFeedbackByGarage,
  viewFeedbackByServiceDetailInGarage,
} from "../controller/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

router.post("/add", authMiddleware, addFeedback);
router.get("/garage/:id", viewFeedbackByGarageId);
router.put("/:id", authMiddleware, updateFeedback);
router.delete("/:id", authMiddleware, deleteFeedback);
router.delete(
  "/delete/:id",
  authorizeRoles(["staff", "manager"]),
  deleteFeedbackByGarage
);
router.get(
  "/garage/:garageId/service/:serviceDetailId",
  viewFeedbackByServiceDetailInGarage
);

export default router;
