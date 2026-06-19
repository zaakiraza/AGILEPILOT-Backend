import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";
import { verifyToken } from "../utils/jwt.js";

const auth = async (req, res, next) => {
  try {
    const header = req.headers.authorization;

    if (!header?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication required");
    }

    const token = header.split(" ")[1];
    const decoded = verifyToken(token, process.env.JWT_SECRET);

    const user = await UserRepository.findById(decoded.userId);

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid or inactive account");
    }

    req.user = user;
    req.organizationId = user.organizationId?.toString() ?? null;
    next();
  } catch (error) {
    if (
      error.message === "Invalid token" ||
      error.message === "Token expired" ||
      error.name === "TokenExpiredError"
    ) {
      return next(new ApiError(401, "Invalid or expired token"));
    }
    next(error);
  }
};

export default auth;
