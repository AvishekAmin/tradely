import * as withdrawalService from "../services/withdrawalService.js";

export const createWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const payload = req.validatedWithdrawal || req.body;

    const result = await withdrawalService.createWithdrawal(userId, payload);

    return res.status(201).json({
      success: true,
      message: result.message,
      data: {
        transaction: result.transaction,
        funds: result.funds,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "WITHDRAWAL_ERROR",
        message: err.message,
      });
    }
    next(err);
  }
};

export const getWithdrawals = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const withdrawals = await withdrawalService.getWithdrawals(userId);

    return res.json({
      success: true,
      data: withdrawals,
    });
  } catch (err) {
    next(err);
  }
};

export const getWithdrawalById = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const withdrawal = await withdrawalService.getWithdrawalById(userId, id);

    return res.json({
      success: true,
      data: withdrawal,
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "WITHDRAWAL_NOT_FOUND",
        message: err.message,
      });
    }
    next(err);
  }
};

export const cancelWithdrawal = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    const result = await withdrawalService.cancelWithdrawal(userId, id);

    return res.json({
      success: true,
      message: result.message,
      data: {
        transaction: result.transaction,
        funds: result.funds,
      },
    });
  } catch (err) {
    if (err.status) {
      return res.status(err.status).json({
        success: false,
        code: err.code || "CANCEL_WITHDRAWAL_ERROR",
        message: err.message,
      });
    }
    next(err);
  }
};
