// filepath: d:\CN9\project_backend_sep490\backend\DriveOn_Backend\server.js
import express from "express";
import { adminMiddleware } from "../middleware/adminMiddleware.js";
import { viewAdminDashboardOverview, getGarageStatusCountsByMonth } from "../controller/garageController.js";
import { getServiceUsageCounts } from "../controller/serviceDetailController.js";
import { getTransactionsByMonth } from "../controller/payosController.js";
import { getUserCountsByRole } from "../controller/userController.js";

const router = express.Router();

router.get("/dashboard-overview", adminMiddleware, viewAdminDashboardOverview); // Admin dashboard overview
router.get("/garage-status-counts", adminMiddleware, getGarageStatusCountsByMonth); // Garage status counts by month
router.get("/service-usage-counts", adminMiddleware, getServiceUsageCounts); // đếm số service đã đc gara sử dụng
router.get("/transactions-by-month", adminMiddleware, getTransactionsByMonth); // đếm số transaction đã đc thanh toán theo tháng
router.get("/user-counts-by-role", adminMiddleware, getUserCountsByRole); // Tỷ lệ người dùng theo vai trò

export default router;