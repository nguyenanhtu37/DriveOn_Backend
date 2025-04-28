import * as transactionService from "../service/transactionService.js";

export const createTransaction = async (req, res) => {
  const transactionData = req.body;

  try {
    const transaction = await transactionService.createTransaction(
      transactionData
    );
    res.status(201).json(transaction);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getTransactions = async (req, res) => {
  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || -1,
    };

    const result = await transactionService.getTransactions({}, options);
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getTransactionById = async (req, res) => {
  const { id } = req.params;

  try {
    const transaction = await transactionService.getTransactionById(id);
    res.status(200).json(transaction);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getTransactionByOrderCode = async (req, res) => {
  const { orderCode } = req.params;

  try {
    const transaction = await transactionService.getTransactionByOrderCode(
      orderCode
    );
    res.status(200).json(transaction);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const updateTransaction = async (req, res) => {
  const { id } = req.params;
  const updateData = req.body;

  try {
    const transaction = await transactionService.updateTransaction(
      id,
      updateData
    );
    res
      .status(200)
      .json({ message: "Transaction updated successfully", transaction });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const updateTransactionStatus = async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const transaction = await transactionService.updateTransactionStatus(
      id,
      status
    );
    res.status(200).json({
      message: "Transaction status updated successfully",
      transaction,
    });
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const deleteTransaction = async (req, res) => {
  const { id } = req.params;

  try {
    const result = await transactionService.deleteTransaction(id);
    res.status(200).json(result);
  } catch (err) {
    if (err.status === 404) {
      return res.status(404).json({ message: "Transaction not found" });
    }
    if (err.status === 400) {
      return res.status(400).json({ message: err.message });
    }
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getGarageRevenueByMonth = async (req, res) => {
  const { garageId } = req.params;
  const year = parseInt(req.query.year) || new Date().getFullYear();

  try {
    const revenueData = await transactionService.getGarageRevenueByMonth(
      garageId,
      year
    );
    res.status(200).json({
      garageId,
      year,
      revenueData,
    });
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};

export const getTransactionsByGarageId = async (req, res) => {
  const { garageId } = req.params;

  try {
    const options = {
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 10,
      sortBy: req.query.sortBy || "createdAt",
      sortOrder: req.query.sortOrder || -1,
    };

    const result = await transactionService.getTransactionsByGarageId(
      garageId,
      options
    );
    res.status(200).json(result);
  } catch (err) {
    res.status(err.status || 500).json({ error: err.message });
  }
};
