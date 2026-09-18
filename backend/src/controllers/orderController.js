import * as orderExecutionService from "../services/orderExecutionService.js";

/**
 * Controller to fetch all orders for the authenticated user (sorted newest first)
 */
export const getOrders = async (req, res, next) => {
  try {
    const userOrders = await orderExecutionService.getAllOrders(req.user._id);
    return res.json(userOrders);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to create and execute a new order for the authenticated user
 */
export const createOrder = async (req, res, next) => {
  try {
    const orderPayload = req.validatedOrder || req.body;
    const result = await orderExecutionService.executeOrder(orderPayload, req.user);

    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};
