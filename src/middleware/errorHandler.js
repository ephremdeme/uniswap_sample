import ErrorResponse from "../util/errorResponse";

export const RESPONSE_STATUS_CODE = {
  success: 200,
  bad_request: 400,
  internal_server_error: 500,
  un_authorized: 401,
  not_found: 404,
};

// eslint-disable-next-line no-unused-vars
export const errorHandler = () => (err, req, res, _next) => {
  let error = { ...err };

  if (err.name === "CastError") {
    const message = `Document not found with id of ${err.value}`;
    error = new ErrorResponse(message, RESPONSE_STATUS_CODE.not_found);
  }
  if (err.name === "UnauthorizedError") {
    const message = `Your session has expired, Please login again!`;
    error = new ErrorResponse(message, RESPONSE_STATUS_CODE.un_authorized);
  }

  if (err.name)
    res.status(error.statusCode || 500).json({
      success: false,
      error: {
        message: error.message || err.message || "Server Error",
        statusCode: error.statusCode || 500,
      },
      message: error.message || err.message || "Server Error",
      data: null,
    });
  else if (err.code)
    res.status(error.statusCode || 500).json({
      success: false,
      error: { err },
      message: error.message || err.message || "Server Error",
      data: null,
    });
};
