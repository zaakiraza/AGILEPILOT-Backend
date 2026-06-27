import ProjectMember from "../models/ProjectMember.js";
import { PROJECT_ROLES } from "../config/roles.js";
import BaseRepository from "./BaseRepository.js";

class ProjectMemberRepository extends BaseRepository {
  constructor() {
    super(ProjectMember);
  }

  async findByProject(projectId) {
    return ProjectMember.find({ projectId })
      .populate("userId", "name email orgRole")
      .sort({ createdAt: 1 });
  }

  async findByProjectAndUser(projectId, userId) {
    return ProjectMember.findOne({ projectId, userId });
  }

  async findProjectManager(projectId) {
    return ProjectMember.findOne({
      projectId,
      projectRole: PROJECT_ROLES.PROJECT_MANAGER,
    }).populate("userId", "name email orgRole");
  }

  async findProjectManagersByProjectIds(projectIds) {
    if (!projectIds.length) return [];
    return ProjectMember.find({
      projectId: { $in: projectIds },
      projectRole: PROJECT_ROLES.PROJECT_MANAGER,
    }).populate("userId", "name email orgRole");
  }

  async findTeamLead(projectId) {
    return ProjectMember.findOne({
      projectId,
      projectRole: PROJECT_ROLES.TEAM_LEAD,
    });
  }

  async findProjectsForUser(userId) {
    const memberships = await ProjectMember.find({ userId }).select("projectId");
    return memberships.map((m) => m.projectId);
  }

  async deleteByProjectAndUser(projectId, userId) {
    return ProjectMember.deleteOne({ projectId, userId });
  }

  async findByIdPopulated(id) {
    return ProjectMember.findById(id).populate("userId", "name email orgRole");
  }
}

export default new ProjectMemberRepository();
