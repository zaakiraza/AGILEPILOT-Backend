import { PROJECT_ROLES } from "../config/roles.js";
import ProgressReportRepository from "../repositories/ProgressReportRepository.js";
import TaskRepository from "../repositories/TaskRepository.js";
import ApiError from "../utils/ApiError.js";
import { buildMultiSheetExcelXml } from "../utils/excelBuilder.js";
import { buildSimplePdf } from "../utils/pdfBuilder.js";
import ProjectService from "./ProjectService.js";

const EXPORT_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.TEAM_LEAD];

class ExportService {
  formatDate(date) {
    if (!date) return "";
    return new Date(date).toISOString().split("T")[0];
  }

  async gatherExportData(actor, projectId, reportId) {
    await ProjectService.assertProjectAccess(actor, projectId, EXPORT_ROLES);

    const report = await ProgressReportRepository.findByProjectAndId(
      projectId,
      reportId
    );

    if (!report) {
      throw new ApiError(404, "Progress report not found");
    }

    const project = await ProjectService.getProject(actor, projectId);
    const tasks = await TaskRepository.findByProject(projectId);

    const scope = report.milestoneId
      ? `Milestone: ${report.milestoneId?.title ?? report.milestoneId}`
      : report.taskId
        ? `Task: ${report.taskId?.title ?? report.taskId}`
        : "Entire project";

    return {
      project,
      report,
      tasks,
      meta: {
        projectName: project.name,
        scope,
        submittedBy: report.submittedBy?.name ?? "Unknown",
        submittedEmail: report.submittedBy?.email ?? "",
        periodStart: this.formatDate(report.periodStart),
        periodEnd: this.formatDate(report.periodEnd),
        autoCompletionPercent: report.autoCompletionPercent,
        manualNotes: report.manualNotes,
        combinedSummary: report.combinedSummary,
        generatedAt: new Date().toISOString(),
      },
    };
  }

  buildPdfLines({ meta }) {
    return [
      "AgilePilot - Progress Report",
      "----------------------------------------",
      `Project: ${meta.projectName}`,
      `Scope: ${meta.scope}`,
      `Period: ${meta.periodStart} to ${meta.periodEnd}`,
      `Submitted by: ${meta.submittedBy} (${meta.submittedEmail})`,
      `Auto completion: ${meta.autoCompletionPercent}%`,
      "",
      "Manual notes:",
      meta.manualNotes || "(none)",
      "",
      "Summary:",
      ...meta.combinedSummary.split("\n"),
      "",
      `Generated: ${meta.generatedAt}`,
    ];
  }

  async exportPdf(actor, projectId, reportId) {
    const data = await this.gatherExportData(actor, projectId, reportId);
    const buffer = buildSimplePdf(this.buildPdfLines(data));

    return {
      buffer,
      filename: `progress-report-${reportId}.pdf`,
      contentType: "application/pdf",
    };
  }

  async exportExcel(actor, projectId, reportId) {
    const { meta, report, tasks } = await this.gatherExportData(
      actor,
      projectId,
      reportId
    );

    const summarySheet = {
      name: "Summary",
      headers: ["Field", "Value"],
      rows: [
        ["Project", meta.projectName],
        ["Scope", meta.scope],
        ["Period start", meta.periodStart],
        ["Period end", meta.periodEnd],
        ["Submitted by", meta.submittedBy],
        ["Email", meta.submittedEmail],
        ["Auto completion %", meta.autoCompletionPercent],
        ["Manual notes", meta.manualNotes],
        ["Combined summary", meta.combinedSummary],
        ["Report created", this.formatDate(report.createdAt)],
        ["Generated at", meta.generatedAt],
      ],
    };

    const tasksSheet = {
      name: "Tasks",
      headers: ["Title", "Status", "Priority", "Assignee", "Est. hours", "Actual hours"],
      rows: tasks.map((task) => [
        task.title,
        task.status,
        task.priority,
        task.assigneeId?.name ?? "",
        task.estimatedHours ?? 0,
        task.actualHours ?? 0,
      ]),
    };

    const xml = buildMultiSheetExcelXml([summarySheet, tasksSheet]);
    const buffer = Buffer.from(xml, "utf8");

    return {
      buffer,
      filename: `progress-report-${reportId}.xls`,
      contentType: "application/vnd.ms-excel",
    };
  }

  async exportReport(actor, projectId, reportId, format) {
    if (format === "pdf") {
      return this.exportPdf(actor, projectId, reportId);
    }

    if (format === "excel") {
      return this.exportExcel(actor, projectId, reportId);
    }

    throw new ApiError(400, "format must be pdf or excel");
  }
}

export default new ExportService();
