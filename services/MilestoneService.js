import { PROJECT_ROLES } from "../config/roles.js";
import MilestoneRepository from "../repositories/MilestoneRepository.js";
import ApiError from "../utils/ApiError.js";
import ProjectService from "./ProjectService.js";

const MANAGE_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.TEAM_LEAD];
const VIEW_ROLES = [
  "admin",
  PROJECT_ROLES.PROJECT_MANAGER,
  PROJECT_ROLES.TEAM_LEAD,
  PROJECT_ROLES.TEAM_MEMBER,
];

class MilestoneService {
  async createMilestone(actor, projectId, data) {
    await ProjectService.assertProjectAccess(actor, projectId, MANAGE_ROLES);

    const order =
      data.order ?? (await MilestoneRepository.getMaxOrder(projectId)) + 1;

    const milestone = await MilestoneRepository.create({
      projectId,
      title: data.title,
      description: data.description,
      dueDate: data.dueDate,
      status: data.status,
      order,
      createdBy: actor._id,
    });

    return milestone;
  }

  async listMilestones(actor, projectId) {
    await ProjectService.assertProjectAccess(actor, projectId, VIEW_ROLES);
    return MilestoneRepository.findByProject(projectId);
  }

  async getMilestone(actor, projectId, milestoneId) {
    await ProjectService.assertProjectAccess(actor, projectId, VIEW_ROLES);

    const milestone = await MilestoneRepository.findByProjectAndId(
      projectId,
      milestoneId
    );

    if (!milestone) {
      throw new ApiError(404, "Milestone not found");
    }

    return milestone;
  }

  async updateMilestone(actor, projectId, milestoneId, updates) {
    await ProjectService.assertProjectAccess(actor, projectId, MANAGE_ROLES);

    const milestone = await MilestoneRepository.findByProjectAndId(
      projectId,
      milestoneId
    );

    if (!milestone) {
      throw new ApiError(404, "Milestone not found");
    }

    return MilestoneRepository.updateById(milestoneId, updates);
  }

  async deleteMilestone(actor, projectId, milestoneId) {
    await ProjectService.assertProjectAccess(actor, projectId, MANAGE_ROLES);

    const milestone = await MilestoneRepository.findByProjectAndId(
      projectId,
      milestoneId
    );

    if (!milestone) {
      throw new ApiError(404, "Milestone not found");
    }

    await MilestoneRepository.deleteById(milestoneId);

    return { deleted: true };
  }
}

export default new MilestoneService();
