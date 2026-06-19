import Project from "../models/Project.js";
import BaseRepository from "./BaseRepository.js";

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  async findByIdAndOrg(id, organizationId) {
    return Project.findOne({ _id: id, organizationId }).populate(
      "projectManagerId",
      "name email orgRole"
    );
  }

  async findByOrg(organizationId, filter = {}) {
    return Project.find({ organizationId, ...filter })
      .populate("projectManagerId", "name email orgRole")
      .sort({ createdAt: -1 });
  }

  async findByIds(projectIds) {
    return Project.find({ _id: { $in: projectIds } })
      .populate("projectManagerId", "name email orgRole")
      .sort({ createdAt: -1 });
  }
}

export default new ProjectRepository();
