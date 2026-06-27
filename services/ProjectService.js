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

  async syncLegacyProjectManager(project) {
    const existing = await ProjectMemberRepository.findProjectManager(project._id);
    if (existing) return existing;

    const legacyId =
      project.projectManagerId?._id?.toString() ??
      project.projectManagerId?.toString();

    if (!legacyId) return null;

    const member = await ProjectMemberRepository.create({
      projectId: project._id,
      userId: legacyId,
      projectRole: PROJECT_ROLES.PROJECT_MANAGER,
    });

    await ProjectRepository.updateById(project._id, {
      $unset: { projectManagerId: 1 },
    });

    return ProjectMemberRepository.findByIdPopulated(member._id);
  }

  async attachProjectManager(project) {
    if (!project) return null;

    await this.syncLegacyProjectManager(project);

    const pmRecord = await ProjectMemberRepository.findProjectManager(
      project._id
    );
    const plain = project.toObject ? project.toObject() : { ...project };
    plain.projectManagerId = pmRecord?.userId ?? null;
    delete plain.projectManagerId_legacy;
    return plain;
  }

  async attachProjectManagers(projects) {
    if (!projects.length) return [];

    const ids = projects.map((p) => p._id);
    const pmRecords = await ProjectMemberRepository.findProjectManagersByProjectIds(
      ids
    );
    const pmByProject = new Map(
      pmRecords.map((m) => [m.projectId.toString(), m.userId])
    );

    return Promise.all(
      projects.map(async (project) => {
        let pmUser = pmByProject.get(project._id.toString());
        if (!pmUser && project.projectManagerId) {
          const synced = await this.syncLegacyProjectManager(project);
          pmUser = synced?.userId ?? null;
        }
        const plain = project.toObject ? project.toObject() : { ...project };
        plain.projectManagerId = pmUser ?? null;
        return plain;
      })
    );
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
    const project = await ProjectRepository.findById(projectId);
    if (!project) return null;
    return this.attachProjectManager(project);
  }

  async assertProjectAccess(actor, projectId, allowedRoles = []) {
    const project = await ProjectRepository.findById(projectId);

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

  async validateAssignableUser(organizationId, userId) {
    const user = await UserRepository.findById(userId);

    if (!user || !user.isActive) {
      throw new ApiError(404, "User not found");
    }

    if (
      user.orgRole === ORG_ROLES.ADMIN ||
      user.orgRole === ORG_ROLES.SUPER_ADMIN
    ) {
      throw new ApiError(400, "Admin accounts cannot be assigned to projects");
    }

    const assignableRoles = [
      ORG_ROLES.MEMBER,
      "teamMember",
      "projectManager",
    ];

    if (!assignableRoles.includes(user.orgRole)) {
      throw new ApiError(400, "User cannot be assigned to projects");
    }

    if (user.organizationId?.toString() !== organizationId.toString()) {
      throw new ApiError(400, "User must belong to the same organization");
    }

    return user;
  }

  async assignProjectManager(projectId, organizationId, newProjectManagerId) {
    const project = await ProjectRepository.findById(projectId);

    if (!project) {
      throw new ApiError(404, "Project not found");
    }

    if (project.organizationId.toString() !== organizationId.toString()) {
      throw new ApiError(403, "You do not have access to this project");
    }

    await this.validateAssignableUser(organizationId, newProjectManagerId);

    const currentPm = await ProjectMemberRepository.findProjectManager(projectId);

    if (
      currentPm &&
      currentPm.userId._id?.toString() === newProjectManagerId.toString()
    ) {
      throw new ApiError(400, "This user is already the project manager for this project");
    }

    if (currentPm) {
      await ProjectMemberRepository.updateById(currentPm._id, {
        projectRole: PROJECT_ROLES.TEAM_MEMBER,
      });
    }

    const existing = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      newProjectManagerId
    );

    if (existing) {
      await ProjectMemberRepository.updateById(existing._id, {
        projectRole: PROJECT_ROLES.PROJECT_MANAGER,
      });
    } else {
      await ProjectMemberRepository.create({
        projectId,
        userId: newProjectManagerId,
        projectRole: PROJECT_ROLES.PROJECT_MANAGER,
      });
    }

    await ProjectRepository.updateById(projectId, {
      $unset: { projectManagerId: 1 },
    });

    return this.populateProject(projectId);
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

    await this.validateAssignableUser(actor.organizationId, projectManagerId);

    const project = await ProjectRepository.create({
      organizationId: actor.organizationId,
      name,
      description,
      status,
      currency,
      startDate,
      endDate,
      createdBy: actor._id,
    });

    await ProjectMemberRepository.create({
      projectId: project._id,
      userId: projectManagerId,
      projectRole: PROJECT_ROLES.PROJECT_MANAGER,
    });

    return this.populateProject(project._id);
  }

  async listProjects(actor) {
    if (actor.orgRole === ORG_ROLES.ADMIN) {
      this.assertAdminHasOrganization(actor);
      const projects = await ProjectRepository.findByOrg(actor.organizationId);
      return this.attachProjectManagers(projects);
    }

    if (!actor.organizationId) {
      throw new ApiError(403, "You do not have permission to list projects");
    }

    const projectIds = await ProjectMemberRepository.findProjectsForUser(
      actor._id
    );

    if (!projectIds.length) {
      return [];
    }

    const projects = await ProjectRepository.findByIds(projectIds);
    return this.attachProjectManagers(projects);
  }

  async getProject(actor, projectId) {
    const { project } = await this.assertProjectAccess(actor, projectId);
    return this.attachProjectManager(project);
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
      const updated = await this.assignProjectManager(
        projectId,
        project.organizationId,
        updates.projectManagerId
      );

      const { projectManagerId: _pm, ...rest } = updates;
      if (Object.keys(rest).length === 0) {
        return updated;
      }

      const final = await ProjectRepository.updateById(projectId, rest);
      return this.populateProject(final._id);
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

    return this.assignProjectManager(
      projectId,
      actor.organizationId,
      projectManagerId
    );
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

    await this.syncLegacyProjectManager(
      await ProjectRepository.findById(projectId)
    );

    const members = await ProjectMemberRepository.findByProject(projectId);
    const pm = members.find(
      (m) => m.projectRole === PROJECT_ROLES.PROJECT_MANAGER
    );

    return {
      projectManager: pm?.userId ?? null,
      members: members.filter(
        (m) => m.projectRole !== PROJECT_ROLES.PROJECT_MANAGER
      ),
    };
  }

  async addMember(actor, projectId, userId) {
    const { project } = await this.assertProjectAccess(actor, projectId, ["admin"]);

    const user = await this.validateAssignableUser(
      project.organizationId,
      userId
    );

    const existing = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (existing) {
      if (existing.projectRole === PROJECT_ROLES.PROJECT_MANAGER) {
        throw new ApiError(400, "User is already the project manager on this project");
      }
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
    await this.assertProjectAccess(actor, projectId, ["admin"]);

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (!membership) {
      throw new ApiError(404, "Project member not found");
    }

    if (membership.projectRole === PROJECT_ROLES.PROJECT_MANAGER) {
      throw new ApiError(
        400,
        "Cannot remove the project manager. Assign a new project manager first."
      );
    }

    await ProjectMemberRepository.deleteById(membership._id);

    return { removed: true };
  }

  async promoteToTeamLead(actor, projectId, userId) {
    await this.assertProjectAccess(actor, projectId, ["admin"]);

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      userId
    );

    if (!membership) {
      throw new ApiError(404, "User is not a member of this project");
    }

    if (membership.projectRole === PROJECT_ROLES.PROJECT_MANAGER) {
      throw new ApiError(400, "Project manager cannot be promoted to team lead");
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
    await this.assertProjectAccess(actor, projectId, ["admin"]);

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
