import * as orderLifecycleService from "../services/orderLifecycleService.js";

export const getOrders = async (req, res, next) => {
  try {
    const userOrders = await orderLifecycleService.getAllOrders(req.user._id);
    return res.json(userOrders);
  } catch (err) {
    next(err);
  }
};

export const createOrder = async (req, res, next) => {
  try {
    const orderPayload = req.validatedOrder || req.body;
    const result = await orderLifecycleService.createOrder(
      orderPayload,
      req.user,
    );

    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOrder = async (req, res, next) => {
  try {
    const { orderId } = req.params;
    const result = await orderLifecycleService.cancelOrder(
      orderId,
      req.user._id,
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
};

export const createOCOOrder = async (req, res, next) => {
  try {
    const ocoPayload = req.validatedOCO || req.body;
    const result = await orderLifecycleService.createOCOGroup(
      ocoPayload,
      req.user,
    );

    return res.status(result.statusCode || 201).json({
      success: result.success,
      message: result.message,
      data: result.data,
    });
  } catch (err) {
    next(err);
  }
};

export const cancelOCOGroup = async (req, res, next) => {
  try {
    const { ocoGroupId } = req.params;
    const result = await orderLifecycleService.cancelOCOGroup(
      ocoGroupId,
      req.user._id,
    );
    return res.json(result);
  } catch (err) {
    next(err);
  }
};
