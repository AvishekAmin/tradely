import * as accountService from "../services/accountService.js";

export const getFunds = async (req, res, next) => {
  try {
    const fundsData = await accountService.getFunds(req.user);
    return res.json({
      success: true,
      data: fundsData,
    });
  } catch (err) {
    next(err);
  }
};

export const resetFunds = async (req, res, next) => {
  try {
    const updatedUser = await accountService.resetFunds(req.user);
    return res.json({
      success: true,
      message: "Account balance reset to ₹100,000.00",
      data: { balance: updatedUser.balance },
    });
  } catch (err) {
    next(err);
  }
};
