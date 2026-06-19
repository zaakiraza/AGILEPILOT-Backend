import { PROJECT_ROLES } from "../config/roles.js";
import CostEstimateRepository from "../repositories/CostEstimateRepository.js";
import TaskRepository from "../repositories/TaskRepository.js";
import ApiError from "../utils/ApiError.js";
import ProjectService from "./ProjectService.js";

const ESTIMATE_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER];

class EstimationService {
  normalizeLineItems(lineItems = []) {
    return lineItems.map((item) => {
      const quantity = item.quantity ?? 0;
      const unitCost = item.unitCost ?? 0;
      const amount = item.amount ?? quantity * unitCost;

      return {
        category: item.category,
        description: item.description,
        quantity,
        unitCost,
        amount,
      };
    });
  }

  async computeLaborFromTasks(projectId) {
    const tasks = await TaskRepository.findByProject(projectId);

    const laborTotal = tasks.reduce((sum, task) => {
      const hours = task.estimatedHours ?? 0;
      const rate = task.hourlyRate ?? 0;
      return sum + hours * rate;
    }, 0);

    const taskBreakdown = tasks.map((task) => ({
      taskId: task._id,
      title: task.title,
      estimatedHours: task.estimatedHours ?? 0,
      hourlyRate: task.hourlyRate ?? 0,
      estimatedCost: (task.estimatedHours ?? 0) * (task.hourlyRate ?? 0),
    }));

    return { laborTotal, taskBreakdown };
  }

  async assertEstimateAccess(actor, projectId) {
    return ProjectService.assertProjectAccess(actor, projectId, ESTIMATE_ROLES);
  }

  async getEstimate(actor, projectId) {
    const { project } = await this.assertEstimateAccess(actor, projectId);

    const estimate = await CostEstimateRepository.findByProject(projectId);

    return {
      estimate,
      currency: estimate?.currency ?? project.currency,
    };
  }

  async upsertEstimate(actor, projectId, data) {
    const { project } = await this.assertEstimateAccess(actor, projectId);

    const lineItems = this.normalizeLineItems(data.lineItems ?? []);
    const currency = (data.currency ?? project.currency).toUpperCase();

    const payload = {
      projectId,
      currency,
      lineItems,
      contingencyPercent: data.contingencyPercent ?? 0,
      notes: data.notes ?? "",
      updatedBy: actor._id,
    };

    const existing = await CostEstimateRepository.findByProject(projectId);

    if (existing) {
      const updated = await CostEstimateRepository.updateById(
        existing._id,
        payload
      );
      return updated;
    }

    return CostEstimateRepository.create(payload);
  }

  async getSummary(actor, projectId) {
    const { project } = await this.assertEstimateAccess(actor, projectId);

    return this.buildSummary(projectId, project);
  }

  async buildSummary(projectId, project) {
    const estimate = await CostEstimateRepository.findByProject(projectId);
    const { laborTotal, taskBreakdown } = await this.computeLaborFromTasks(
      projectId
    );

    const lineItemsTotal = (estimate?.lineItems ?? []).reduce(
      (sum, item) => sum + item.amount,
      0
    );

    const subtotal = laborTotal + lineItemsTotal;
    const contingencyPercent = estimate?.contingencyPercent ?? 0;
    const contingencyAmount = (subtotal * contingencyPercent) / 100;
    const grandTotal = subtotal + contingencyAmount;

    return {
      currency: estimate?.currency ?? project.currency,
      laborFromTasks: laborTotal,
      taskBreakdown,
      lineItems: estimate?.lineItems ?? [],
      lineItemsTotal,
      subtotal,
      contingencyPercent,
      contingencyAmount,
      grandTotal,
      notes: estimate?.notes ?? "",
    };
  }

  async computeGrandTotal(projectId, projectCurrency = "USD") {
    const project = { currency: projectCurrency };
    const summary = await this.buildSummary(projectId, project);
    return summary.grandTotal;
  }
}

export default new EstimationService();
