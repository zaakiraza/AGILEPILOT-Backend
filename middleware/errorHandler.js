import ResponseHandler from "../utils/ResponseHandler.js";
import ApiError from "../utils/ApiError.js";

const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return next(err);
  }

  if (err instanceof ApiError) {
    return ResponseHandler.error(res, err.errors, err.message, err.statusCode);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyPattern ?? {})[0] ?? "field";
    return ResponseHandler.error(
      res,
      null,
      `A record with this ${field} already exists`,
      409
    );
  }

  if (err.name === "ValidationError") {
    return ResponseHandler.error(res, err.errors, "Validation failed", 400);
  }

  console.error(err);
  return ResponseHandler.error(res, null, "Internal server error", 500);
};

export default errorHandler;
