import EstimationService from "../services/EstimationService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class EstimateController {
  async get(req, res, next) {
    try {
      const data = await EstimationService.getEstimate(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        data,
        "Cost estimate fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async upsert(req, res, next) {
    try {
      const estimate = await EstimationService.upsertEstimate(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { estimate },
        "Cost estimate saved successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async summary(req, res, next) {
    try {
      const summary = await EstimationService.getSummary(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        { summary },
        "Cost estimate summary fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new EstimateController();
