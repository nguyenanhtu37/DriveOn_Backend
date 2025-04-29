import Transaction from "../models/transaction.js";
import mongoose from "mongoose";

export const createTransaction = async (transactionData) => {
  try {
    const transaction = new Transaction(transactionData);
    return await transaction.save();
  } catch (error) {
    throw new Error(400, `Error creating transaction: ${error.message}`);
  }
};

export const getTransactions = async (filter = {}, options = {}) => {
  try {
    const {
      page = 1,
      limit = 10,
      sortBy = "createdAt",
      sortOrder = -1,
      date = null,
      search = null,
      status = null,
    } = options;
    const skip = (page - 1) * limit;

    // Apply date filter if provided
    if (date) {
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      filter.createdAt = { $gte: startOfDay, $lte: endOfDay };
    }

    // Apply search filter if provided
    if (search) {
      filter.$or = [
        { orderCode: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }
    if (status) {
      filter.status = status;
    }

    const transactions = await Transaction.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip(skip)
      .limit(parseInt(limit))
      .populate("subscriptionId", "name planType")
      .populate("garageId", "name");

    const total = await Transaction.countDocuments(filter);

    return {
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
    };
  } catch (error) {
    throw new Error(500, `Error fetching transactions: ${error.message}`);
  }
};

export const getTransactionById = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(400, "Invalid transaction ID");
    }

    const transaction = await Transaction.findById(id)
      .populate("subscriptionId", "name planType")
      .populate("garageId", "name");

    if (!transaction) {
      throw new Error(404, "Transaction not found");
    }

    return transaction;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error fetching transaction: ${error.message}`);
  }
};

export const getTransactionByOrderCode = async (orderCode) => {
  try {
    const transaction = await Transaction.findOne({ orderCode })
      .populate("subscriptionId", "name planType")
      .populate("garageId", "name");

    if (!transaction) {
      throw new Error(404, "Transaction not found");
    }

    return transaction;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error fetching transaction: ${error.message}`);
  }
};

export const updateTransaction = async (id, updateData) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(400, "Invalid transaction ID");
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw new Error(404, "Transaction not found");
    }

    // Don't allow updating certain fields
    if (updateData.orderCode) delete updateData.orderCode;

    const updatedTransaction = await Transaction.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true }
    );

    return updatedTransaction;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error updating transaction: ${error.message}`);
  }
};

export const updateTransactionStatus = async (id, status) => {
  try {
    if (!["PENDING", "PAID", "FAILED"].includes(status)) {
      throw new Error(400, "Invalid transaction status");
    }

    const updates = { status };
    if (status === "PAID") {
      updates.paidAt = new Date();
    }

    return await updateTransaction(id, updates);
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error updating transaction status: ${error.message}`);
  }
};

export const deleteTransaction = async (id) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new Error(400, "Invalid transaction ID");
    }

    const transaction = await Transaction.findById(id);
    if (!transaction) {
      throw new Error(404, "Transaction not found");
    }

    // If transaction status is PAID, prevent deletion
    if (transaction.status === "PAID") {
      throw new Error(400, "Cannot delete a paid transaction");
    }

    await Transaction.findByIdAndDelete(id);
    return { success: true, message: "Transaction deleted successfully" };
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error deleting transaction: ${error.message}`);
  }
};

export const getGarageRevenueByMonth = async (garageId, year) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(garageId)) {
      throw new Error(400, "Invalid garage ID");
    }

    const startDate = new Date(year, 0, 1);
    const endDate = new Date(year, 11, 31);

    const revenueData = await Transaction.aggregate([
      {
        $match: {
          garageId: new mongoose.Types.ObjectId(garageId),
          status: "PAID",
          paidAt: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $group: {
          _id: { month: "$month" },
          totalRevenue: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
      {
        $sort: { "_id.month": 1 },
      },
    ]);

    // Fill in missing months with zero values
    const monthlyRevenue = Array(12)
      .fill(null)
      .map((_, index) => {
        const monthData = revenueData.find(
          (item) => item._id.month === index + 1
        );
        return {
          month: index + 1,
          totalRevenue: monthData ? monthData.totalRevenue : 0,
          count: monthData ? monthData.count : 0,
        };
      });

    return monthlyRevenue;
  } catch (error) {
    if (error.status) throw error;
    throw new Error(500, `Error fetching revenue data: ${error.message}`);
  }
};

export const getTransactionsByGarageId = async (garageId, options = {}) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(garageId)) {
      throw new Error(400, "Invalid garage ID");
    }

    // Create filter for the specific garage
    const filter = { garageId: garageId };

    // Use the existing getTransactions function with our filter
    return await getTransactions(filter, options);
  } catch (error) {
    if (error.status) throw error;
    throw new Error(
      500,
      `Error fetching garage transactions: ${error.message}`
    );
  }
};
