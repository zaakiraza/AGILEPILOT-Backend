import ResponseHandler from "../utils/ResponseHandler.js";

export const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    query: req.query,
    params: req.params,
  });

  if (!result.success) {
    return ResponseHandler.error(
      res,
      result.error.flatten(),
      "Validation failed",
      400
    );
  }

  req.validated = result.data;
  next();
};

export default validate;
