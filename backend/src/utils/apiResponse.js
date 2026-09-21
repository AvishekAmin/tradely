export const sendSuccess = (
  res,
  statusCode = 200,
  message = null,
  data = null,
) => {
  const response = { success: true };
  if (message !== null && message !== undefined) {
    response.message = message;
  }
  if (data !== null && data !== undefined) {
    response.data = data;
  }
  return res.status(statusCode).json(response);
};

export const sendError = (
  res,
  statusCode = 500,
  code = "INTERNAL_SERVER_ERROR",
  message = "An error occurred",
  details = null,
) => {
  const response = {
    success: false,
    code,
    message,
  };
  if (details !== null && details !== undefined) {
    response.details = details;
  }
  return res.status(statusCode).json(response);
};

export const sendRaw = (res, statusCode = 200, payload = {}) => {
  return res.status(statusCode).json(payload);
};
