import MilestoneService from "../services/MilestoneService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class MilestoneController {
  async create(req, res, next) {
    try {
      const milestone = await MilestoneService.createMilestone(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { milestone },
        "Milestone created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const milestones = await MilestoneService.listMilestones(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        { milestones },
        "Milestones fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const milestone = await MilestoneService.getMilestone(
        req.user,
        req.validated.params.projectId,
        req.validated.params.milestoneId
      );
      return ResponseHandler.success(
        res,
        { milestone },
        "Milestone fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const milestone = await MilestoneService.updateMilestone(
        req.user,
        req.validated.params.projectId,
        req.validated.params.milestoneId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { milestone },
        "Milestone updated successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await MilestoneService.deleteMilestone(
        req.user,
        req.validated.params.projectId,
        req.validated.params.milestoneId
      );
      return ResponseHandler.success(
        res,
        result,
        "Milestone deleted successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new MilestoneController();
