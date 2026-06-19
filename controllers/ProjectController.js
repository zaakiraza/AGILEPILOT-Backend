import ProjectService from "../services/ProjectService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class ProjectController {
  async create(req, res, next) {
    try {
      const project = await ProjectService.createProject(
        req.user,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { project },
        "Project created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const projects = await ProjectService.listProjects(req.user);
      return ResponseHandler.success(
        res,
        { projects },
        "Projects fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const project = await ProjectService.getProject(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        { project },
        "Project fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const project = await ProjectService.updateProject(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { project },
        "Project updated successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async changeManager(req, res, next) {
    try {
      const project = await ProjectService.changeProjectManager(
        req.user,
        req.validated.params.projectId,
        req.validated.body.projectManagerId
      );
      return ResponseHandler.success(
        res,
        { project },
        "Project manager updated successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await ProjectService.deleteProject(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        result,
        "Project deleted successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async listMembers(req, res, next) {
    try {
      const data = await ProjectService.listMembers(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        data,
        "Project members fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async addMember(req, res, next) {
    try {
      const member = await ProjectService.addMember(
        req.user,
        req.validated.params.projectId,
        req.validated.body.userId
      );
      return ResponseHandler.success(
        res,
        { member },
        "Member added successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async removeMember(req, res, next) {
    try {
      const result = await ProjectService.removeMember(
        req.user,
        req.validated.params.projectId,
        req.validated.params.userId
      );
      return ResponseHandler.success(
        res,
        result,
        "Member removed successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async promoteLead(req, res, next) {
    try {
      const member = await ProjectService.promoteToTeamLead(
        req.user,
        req.validated.params.projectId,
        req.validated.params.userId
      );
      return ResponseHandler.success(
        res,
        { member },
        "Member promoted to team lead successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async demoteLead(req, res, next) {
    try {
      const member = await ProjectService.demoteTeamLead(
        req.user,
        req.validated.params.projectId,
        req.validated.params.userId
      );
      return ResponseHandler.success(
        res,
        { member },
        "Team lead demoted successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new ProjectController();
