import * as orderLifecycleService from "../services/orderLifecycleService.js";

/**
 * Controller to fetch all orders for the authenticated user (sorted newest first)
 */
export const getOrders = async (req, res, next) => {
  try {
    const userOrders = await orderLifecycleService.getAllOrders(req.user._id);
    return res.json(userOrders);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to create a new order (MARKET or LIMIT) for the authenticated user
 */
export const createOrder = async (req, res, next) => {
  try {
    const orderPayload = req.validatedOrder || req.body;
    const result = await orderLifecycleService.createOrder(orderPayload, req.user);

    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to cancel an open PENDING order for the authenticated user
 */
export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await orderLifecycleService.cancelOrder(orderId, req.user._id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to create a new OCO (One-Cancels-the-Other) order group
 */
export const createOCOOrder = async (req, res, next) => {
  try {
    const ocoPayload = req.validatedOCO || req.body;
    const result = await orderLifecycleService.createOCOGroup(ocoPayload, req.user);

    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

/**
 * Controller to cancel an entire OCO group
 */
export const cancelOCOGroup = async (req, res, next) => {
  try {
    const { ocoGroupId } = req.params;
    const result = await orderLifecycleService.cancelOCOGroup(ocoGroupId, req.user._id);
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

