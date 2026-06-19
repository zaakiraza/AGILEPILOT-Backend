import { PERMISSIONS } from "../config/permissions.js";
import { ORG_ROLES } from "../config/roles.js";
import ApiError from "../utils/ApiError.js";

const authorize =
  (...permissionKeys) =>
  (req, res, next) => {
    if (!req.user) {
      return next(new ApiError(401, "Authentication required"));
    }

    const allowedRoles = permissionKeys.flatMap(
      (key) => PERMISSIONS[key] ?? []
    );

    if (!allowedRoles.length) {
      return next(new ApiError(500, "Permission not configured"));
    }

    if (!allowedRoles.includes(req.user.orgRole)) {
      return next(new ApiError(403, "You do not have permission for this action"));
    }

    next();
  };

export const requireSuperAdmin = (req, res, next) => {
  if (req.user?.orgRole !== ORG_ROLES.SUPER_ADMIN) {
    return next(new ApiError(403, "Super admin access required"));
  }
  next();
};

export default authorize;
