import { ORG_ROLES, PROJECT_ROLES } from "../config/roles.js";
import ProjectMemberRepository from "../repositories/ProjectMemberRepository.js";
import ProjectRepository from "../repositories/ProjectRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";

class ProjectService {
  assertAdminHasOrganization(actor) {
    if (actor.orgRole === ORG_ROLES.ADMIN && !actor.organizationId) {
      throw new ApiError(400, "Create your organization before managing projects");
    }
  }

  async resolveProjectRole(actor, project) {
    if (actor.orgRole === ORG_ROLES.ADMIN) {
      if (
        actor.organizationId?.toString() === project.organizationId.toString()
      ) {
        return "admin";
      }
      throw new ApiError(403, "You do not have access to this project");
    }

    if (project.projectManagerId._id?.toString() === actor._id.toString() ||
        project.projectManagerId.toString() === actor._id.toString()) {
      return PROJECT_ROLES.PROJECT_MANAGER;
    }

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      project._id,
      actor._id
    );

    if (!membership) {
      throw new ApiError(403, "You do not have access to this project");
    }

    return membership.projectRole;
  }

  async populateProject(projectId) {
    return ProjectRepository.model
      .findById(projectId)
      .populate("projectManagerId", "name email orgRole");
  }

  async assertProjectAccess(actor, projectId, allowedRoles = []) {
    const project = await this.populateProject(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (actor.orgRole !== ORG_ROLES.SUPER_ADMIN) {
      if (
        !actor.organizationId ||
        actor.organizationId.toString() !== project.organizationId.toString()
      ) {
        throw new ApiError(403, "You do not have access to this project");
      }
    }

    const projectRole = await this.resolveProjectRole(actor, project);

    if (allowedRoles.length && !allowedRoles.includes(projectRole)) {
      throw new ApiError(403, "You do not have permission for this action");
    }

    return { project, projectRole };
  }

  async validateProjectManager(organizationId, projectManagerId) {
    const pm = await UserRepository.findById(projectManagerId);

    if (!pm || !pm.isActive) {
      throw new ApiError(404, "Project manager user not found");
    }

    if (pm.organizationId?.toString() !== organizationId.toString()) {
      throw new ApiError(400, "Project manager must belong to the same organization");
    }

    return pm;
  }

  async createProject(actor, data) {
    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "Only admin can create projects");
    }

    this.assertAdminHasOrganization(actor);

    const {
      name,
      description,
      status,
      currency,
      startDate,
      endDate,
      projectManagerId,
    } = data;

    await this.validateProjectManager(actor.organizationId, projectManagerId);

    const project = await ProjectRepository.create({
      organizationId: actor.organizationId,
      name,
      description,
      status,
      currency,
      startDate,
      endDate,
      projectManagerId,
      createdBy: actor._id,
    });

    return this.populateProject(project._id);
  }

  async listProjects(actor) {
    if (actor.orgRole === ORG_ROLES.ADMIN) {
      this.assertAdminHasOrganization(actor);
      return ProjectRepository.findByOrg(actor.organizationId);
    }

    if (actor.orgRole === ORG_ROLES.PROJECT_MANAGER) {
      return ProjectRepository.findByOrg(actor.organizationId, {
        projectManagerId: actor._id,
      });
    }

    if (actor.orgRole === ORG_ROLES.TEAM_MEMBER) {
      const projectIds = await ProjectMemberRepository.findProjectsForUser(
        actor._id
      );

      if (!projectIds.length) {
        return [];
      }

      return ProjectRepository.findByIds(projectIds);
    }

    throw new ApiError(403, "You do not have permission to list projects");
  }

  async getProject(actor, projectId) {
    const { project } = await this.assertProjectAccess(actor, projectId);
    return project;
  }

  async updateProject(actor, projectId, updates) {
    const { project, projectRole } = await this.assertProjectAccess(
      actor,
      projectId,
      ["admin", PROJECT_ROLES.PROJECT_MANAGER]
    );

    if (updates.projectManagerId && projectRole !== "admin") {
      throw new ApiError(403, "Only admin can change the project manager");
    }

    if (updates.projectManagerId) {
      await this.validateProjectManager(
        project.organizationId,
        updates.projectManagerId
      );
    }

    const updated = await ProjectRepository.updateById(projectId, updates);

    return this.populateProject(updated._id);
  }

  async changeProjectManager(actor, projectId, projectManagerId) {
    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "Only admin can change the project manager");
    }

    this.assertAdminHasOrganization(actor);

    const project = await ProjectRepository.findByIdAndOrg(
      projectId,
      actor.organizationId
    );

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    await this.validateProjectManager(actor.organizationId, projectManagerId);

    const updated = await ProjectRepository.updateById(projectId, {
      projectManagerId,
    });

    return this.populateProject(updated._id);
  }

  async deleteProject(actor, projectId) {
    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "Only admin can delete projects");
    }

    this.assertAdminHasOrganization(actor);

    const project = await ProjectRepository.findByIdAndOrg(
      projectId,
      actor.organizationId
    );

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    await ProjectMemberRepository.model.deleteMany({ projectId });
    await ProjectRepository.deleteById(projectId);

    return { deleted: true };
  }

  async listMembers(actor, projectId) {
    await this.assertProjectAccess(actor, projectId, [
      "admin",
      PROJECT_ROLES.PROJECT_MANAGER,
      PROJECT_ROLES.TEAM_LEAD,
    ]);

    const members = await ProjectMemberRepository.findByProject(projectId);
    const project = await this.populateProject(projectId);

    return {
      projectManager: project.projectManagerId,
      members,
    };
  }

  async addMember(actor, projectId, userId) {
    const { project } = await this.assertProjectAccess(actor, projectId, [
      "admin",
      PROJECT_ROLES.PROJECT_MANAGER,
    ]);

    if (project.projectManagerId._id?.toString() === userId ||
        project.projectManagerId.toString() === userId) {
      throw new ApiError(400, "Project manager is already assigned to this project");
    }

    const user = await UserRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new ApiError(404, "User not found");
    }

    if (user.organizationId?.toString() !== project.organizationId.toString()) {
      throw new ApiError(400, "User must belong to the same organization");
    }

    const existing = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (existing) {
      throw new ApiError(409, "User is already a member of this project");
    }

    const member = await ProjectMemberRepository.create({
      projectId,
      userId,
      projectRole: PROJECT_ROLES.TEAM_MEMBER,
    });

    return ProjectMemberRepository.findByIdPopulated(member._id);
  }

  async removeMember(actor, projectId, userId) {
    await this.assertProjectAccess(actor, projectId, [
      "admin",
      PROJECT_ROLES.PROJECT_MANAGER,
    ]);

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (!membership) {
      throw new ApiError(404, "Project member not found");
    }

    await ProjectMemberRepository.deleteById(membership._id);

    return { removed: true };
  }

  async promoteToTeamLead(actor, projectId, userId) {
    await this.assertProjectAccess(actor, projectId, [
      "admin",
      PROJECT_ROLES.PROJECT_MANAGER,
    ]);

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (!membership) {
      throw new ApiError(404, "User is not a member of this project");
    }

    const existingLead = await ProjectMemberRepository.findTeamLead(projectId);

    if (existingLead && existingLead.userId.toString() !== userId) {
      throw new ApiError(
        409,
        "Project already has a team lead. Demote them first."
      );
    }

    const updated = await ProjectMemberRepository.updateById(membership._id, {
      projectRole: PROJECT_ROLES.TEAM_LEAD,
    });

    return ProjectMemberRepository.findByIdPopulated(updated._id);
  }

  async demoteTeamLead(actor, projectId, userId) {
    await this.assertProjectAccess(actor, projectId, [
      "admin",
      PROJECT_ROLES.PROJECT_MANAGER,
    ]);

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (!membership) {
      throw new ApiError(404, "Project member not found");
    }

    if (membership.projectRole !== PROJECT_ROLES.TEAM_LEAD) {
      throw new ApiError(400, "User is not a team lead on this project");
    }

    const updated = await ProjectMemberRepository.updateById(membership._id, {
      projectRole: PROJECT_ROLES.TEAM_MEMBER,
    });

    return ProjectMemberRepository.findByIdPopulated(updated._id);
  }
}

export default new ProjectService();
