import Project from "../models/Project.js";
import BaseRepository from "./BaseRepository.js";

class ProjectRepository extends BaseRepository {
  constructor() {
    super(Project);
  }

  async findByIdAndOrg(id, organizationId) {
    return Project.findOne({ _id: id, organizationId });
  }

  async findByOrg(organizationId, filter = {}) {
    return Project.find({ organizationId, ...filter }).sort({ createdAt: -1 });
  }

  async findByIds(projectIds) {
    return Project.find({ _id: { $in: projectIds } }).sort({ createdAt: -1 });
  }

  async findAll() {
    return Project.find().sort({ createdAt: -1 });
  }
}

export default new ProjectRepository();
