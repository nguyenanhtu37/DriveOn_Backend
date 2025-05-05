import express from "express";
import {
  createTransaction,
  getTransactions,
  getTransactionById,
  getTransactionByOrderCode,
  updateTransaction,
  updateTransactionStatus,
  deleteTransaction,
  getGarageRevenueByMonth,
  getTransactionsByGarageId,
} from "../controller/transactionController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import {
  authorizeRoles
} from "../middleware/authorizeRoles.js";

const router = express.Router();

// Create a new transaction
router.post("/",  authorizeRoles(["manager", "carowner"]), createTransaction);

// Get all transactions with pagination
router.get("/",  authorizeRoles(["admin"]), getTransactions);

// Get transaction by ID
router.get("/:id",  authorizeRoles(["admin"]), getTransactionById);

// Get transaction by order code
router.get("/order/:orderCode", authMiddleware, getTransactionByOrderCode);

// Update transaction
router.put("/:id", authMiddleware, updateTransaction);

// Update transaction status
router.patch("/:id/status", authMiddleware, updateTransactionStatus);

// Delete transaction
router.delete("/:id", authMiddleware, deleteTransaction);

// Get garage revenue by month
router.get("/revenue/:garageId", authMiddleware, getGarageRevenueByMonth);

// Get transactions by garage ID
router.get("/garage/:garageId", authMiddleware, getTransactionsByGarageId);

export default router;
