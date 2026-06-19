import Milestone from "../models/Milestone.js";
import BaseRepository from "./BaseRepository.js";

class MilestoneRepository extends BaseRepository {
  constructor() {
    super(Milestone);
  }

  async findByProject(projectId) {
    return Milestone.find({ projectId }).sort({ order: 1, createdAt: 1 });
  }

  async findByProjectAndId(projectId, milestoneId) {
    return Milestone.findOne({ _id: milestoneId, projectId });
  }

  async getMaxOrder(projectId) {
    const latest = await Milestone.findOne({ projectId })
      .sort({ order: -1 })
      .select("order");
    return latest?.order ?? -1;
  }
}

export default new MilestoneRepository();
