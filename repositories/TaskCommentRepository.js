import TaskComment from "../models/TaskComment.js";
import BaseRepository from "./BaseRepository.js";

class TaskCommentRepository extends BaseRepository {
  constructor() {
    super(TaskComment);
  }

  async findByTask(taskId) {
    return TaskComment.find({ taskId })
      .populate("userId", "name email orgRole")
      .sort({ createdAt: 1 });
  }
}

export default new TaskCommentRepository();
