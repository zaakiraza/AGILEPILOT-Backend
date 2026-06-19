class ResponseHandler {
  success(res, data, message, status) {
    res.status(status).json({
      status: "success",
      message,
      data,
    });
  }

  error(res, error, message, status) {
    res.status(status).json({
      status: "error",
      message,
      error,
    });
  }
}

export default new ResponseHandler();
