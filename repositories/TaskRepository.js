import Task from "../models/Task.js";
import BaseRepository from "./BaseRepository.js";

class TaskRepository extends BaseRepository {
  constructor() {
    super(Task);
  }

  async findByProject(projectId, filter = {}) {
    return Task.find({ projectId, ...filter })
      .populate("assigneeId", "name email orgRole")
      .populate("milestoneId", "title status")
      .populate("parentTaskId", "title status")
      .sort({ order: 1, createdAt: 1 });
  }

  async findByProjectAndId(projectId, taskId) {
    return Task.findOne({ _id: taskId, projectId })
      .populate("assigneeId", "name email orgRole")
      .populate("milestoneId", "title status")
      .populate("parentTaskId", "title status")
      .populate("dependsOn", "title status");
  }

  async getMaxOrder(projectId, milestoneId) {
    const latest = await Task.findOne({ projectId, milestoneId })
      .sort({ order: -1 })
      .select("order");
    return latest?.order ?? -1;
  }

  async findSubtasks(parentTaskId) {
    return Task.find({ parentTaskId });
  }
}

export default new TaskRepository();
