import ProjectMember from "../models/ProjectMember.js";
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

  async findTeamLead(projectId) {
    return ProjectMember.findOne({ projectId, projectRole: "teamLead" });
  }

  async findProjectsForUser(userId) {
    const memberships = await ProjectMember.find({ userId }).select("projectId");
    return memberships.map((m) => m.projectId);
  }
  async findByIdPopulated(id) {
    return ProjectMember.findById(id).populate("userId", "name email orgRole");
  }
}

export default new ProjectMemberRepository();
