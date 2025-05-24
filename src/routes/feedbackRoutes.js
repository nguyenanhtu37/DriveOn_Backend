import express from "express";
import {
  addFeedback,
  viewFeedbackByGarageId,
  updateFeedback,
  deleteFeedback,
  deleteFeedbackByGarage,
  viewFeedbackByServiceDetailInGarage,
  addMultiFeedback
} from "../controller/feedbackController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import { authorizeRoles } from "../middleware/authorizeRoles.js";

const router = express.Router();

// router.post("/add", authMiddleware, addFeedback);
router.post("/add", authMiddleware, addMultiFeedback); // add feedback
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
); // ng dùng vào phần service trong 1 garage detail sẽ xem được toàn bộ feedback của service đó
// router.post("/add", authMiddleware, addMultiFeedback); // add feedback
export default router;
