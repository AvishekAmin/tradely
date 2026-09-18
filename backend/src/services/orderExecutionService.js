/**
 * orderExecutionService re-exports from orderLifecycleService to preserve
 * backward compatibility while enforcing orderLifecycleService as the sole
 * orchestration layer with zero circular dependencies.
 */
export {
  getAllOrders,
  createOrder,
  createOrder as executeOrder,
  cancelOrder,
  evaluatePendingOrders,
  orderEventEmitter,
} from "./orderLifecycleService.js";
