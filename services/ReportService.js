import { TASK_STATUS } from "../config/constants.js";
import { PROJECT_ROLES } from "../config/roles.js";
import MilestoneRepository from "../repositories/MilestoneRepository.js";
import ProgressReportRepository from "../repositories/ProgressReportRepository.js";
import TaskRepository from "../repositories/TaskRepository.js";
import ApiError from "../utils/ApiError.js";
import ProjectService from "./ProjectService.js";

const SUBMIT_ROLES = [
  "admin",
  PROJECT_ROLES.PROJECT_MANAGER,
  PROJECT_ROLES.TEAM_LEAD,
  PROJECT_ROLES.TEAM_MEMBER,
];

const VIEW_ALL_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.TEAM_LEAD];

class ReportService {
  async computeAutoCompletion(projectId, { milestoneId, taskId } = {}) {
    if (taskId) {
      const task = await TaskRepository.findByProjectAndId(projectId, taskId);

      if (!task) {
        throw new ApiError(404, "Task not found in this project");
      }

      return task.status === TASK_STATUS.DONE ? 100 : 0;
    }

    const filter = milestoneId ? { milestoneId } : {};

    if (milestoneId) {
      const milestone = await MilestoneRepository.findByProjectAndId(
        projectId,
        milestoneId
      );
      if (!milestone) {
        throw new ApiError(404, "Milestone not found in this project");
      }
    }

    const tasks = await TaskRepository.model.find({ projectId, ...filter });

    if (!tasks.length) {
      return 0;
    }

    const doneCount = tasks.filter((t) => t.status === TASK_STATUS.DONE).length;

    return Math.round((doneCount / tasks.length) * 10000) / 100;
  }

  buildCombinedSummary(manualNotes, autoCompletionPercent, scope) {
    const scopeLabel = scope.milestoneId
      ? "milestone"
      : scope.taskId
        ? "task"
        : "project";

    const autoLine = `Auto completion (${scopeLabel}): ${autoCompletionPercent}%`;
    const notesLine = manualNotes?.trim()
      ? `Notes: ${manualNotes.trim()}`
      : "Notes: (none)";

    return `${autoLine}\n${notesLine}`;
  }

  async createReport(actor, projectId, data) {
    await ProjectService.assertProjectAccess(actor, projectId, SUBMIT_ROLES);

    if (data.periodEnd < data.periodStart) {
      throw new ApiError(400, "periodEnd must be on or after periodStart");
    }

    if (data.milestoneId && data.taskId) {
      throw new ApiError(400, "Provide either milestoneId or taskId, not both");
    }

    const autoCompletionPercent = await this.computeAutoCompletion(projectId, {
      milestoneId: data.milestoneId,
      taskId: data.taskId,
    });

    const combinedSummary = this.buildCombinedSummary(
      data.manualNotes,
      autoCompletionPercent,
      { milestoneId: data.milestoneId, taskId: data.taskId }
    );

    const report = await ProgressReportRepository.create({
      projectId,
      milestoneId: data.milestoneId ?? null,
      taskId: data.taskId ?? null,
      submittedBy: actor._id,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
      manualNotes: data.manualNotes ?? "",
      autoCompletionPercent,
      combinedSummary,
    });

    return ProgressReportRepository.findByProjectAndId(projectId, report._id);
  }

  async listReports(actor, projectId) {
    const { projectRole } = await ProjectService.assertProjectAccess(
      actor,
      projectId,
      SUBMIT_ROLES
    );

    const filter = VIEW_ALL_ROLES.includes(projectRole)
      ? {}
      : { submittedBy: actor._id };

    return ProgressReportRepository.findByProject(projectId, filter);
  }

  async getReport(actor, projectId, reportId) {
    const { projectRole } = await ProjectService.assertProjectAccess(
      actor,
      projectId,
      SUBMIT_ROLES
    );

    const report = await ProgressReportRepository.findByProjectAndId(
      projectId,
      reportId
    );

    if (!report) {
      throw new ApiError(404, "Progress report not found");
    }

    if (
      !VIEW_ALL_ROLES.includes(projectRole) &&
      report.submittedBy._id.toString() !== actor._id.toString()
    ) {
      throw new ApiError(403, "You can only view your own progress reports");
    }

    return report;
  }
}

export default new ReportService();
