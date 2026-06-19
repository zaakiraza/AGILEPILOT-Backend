import OrganizationService from "../services/OrganizationService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class OrganizationController {
  async create(req, res, next) {
    try {
      const result = await OrganizationService.createOrganization(
        req.user,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        result,
        "Organization created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async getMine(req, res, next) {
    try {
      const organization = await OrganizationService.getMyOrganization(req.user);
      return ResponseHandler.success(
        res,
        { organization },
        "Organization fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const organizations = await OrganizationService.listOrganizations(req.user);
      return ResponseHandler.success(
        res,
        { organizations },
        "Organizations fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new OrganizationController();
