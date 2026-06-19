import ProgressReport from "../models/ProgressReport.js";
import BaseRepository from "./BaseRepository.js";

class ProgressReportRepository extends BaseRepository {
  constructor() {
    super(ProgressReport);
  }

  async findByProject(projectId, filter = {}) {
    return ProgressReport.find({ projectId, ...filter })
      .populate("submittedBy", "name email orgRole")
      .populate("milestoneId", "title")
      .populate("taskId", "title status")
      .sort({ createdAt: -1 });
  }

  async findByProjectAndId(projectId, reportId) {
    return ProgressReport.findOne({ _id: reportId, projectId })
      .populate("submittedBy", "name email orgRole")
      .populate("milestoneId", "title")
      .populate("taskId", "title status");
  }
}

export default new ProgressReportRepository();
