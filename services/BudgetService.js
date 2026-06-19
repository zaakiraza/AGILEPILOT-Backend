import { PROJECT_ROLES } from "../config/roles.js";
import BudgetRepository from "../repositories/BudgetRepository.js";
import TaskRepository from "../repositories/TaskRepository.js";
import ApiError from "../utils/ApiError.js";
import EstimationService from "./EstimationService.js";
import ProjectService from "./ProjectService.js";

const BUDGET_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER];

class BudgetService {
  async assertBudgetAccess(actor, projectId) {
    return ProjectService.assertProjectAccess(actor, projectId, BUDGET_ROLES);
  }

  async computeActualLabor(projectId) {
    const tasks = await TaskRepository.findByProject(projectId);

    const actualLaborCost = tasks.reduce((sum, task) => {
      const hours = task.actualHours ?? 0;
      const rate = task.hourlyRate ?? 0;
      return sum + hours * rate;
    }, 0);

    const taskBreakdown = tasks.map((task) => ({
      taskId: task._id,
      title: task.title,
      actualHours: task.actualHours ?? 0,
      hourlyRate: task.hourlyRate ?? 0,
      actualCost: (task.actualHours ?? 0) * (task.hourlyRate ?? 0),
    }));

    return { actualLaborCost, taskBreakdown };
  }

  async getBudget(actor, projectId) {
    const { project } = await this.assertBudgetAccess(actor, projectId);

    const budget = await BudgetRepository.findByProject(projectId);

    return {
      budget,
      currency: budget?.currency ?? project.currency,
    };
  }

  async upsertBudget(actor, projectId, data) {
    const { project } = await this.assertBudgetAccess(actor, projectId);

    const currency = (data.currency ?? project.currency).toUpperCase();

    const payload = {
      projectId,
      allocatedAmount: data.allocatedAmount,
      currency,
      updatedBy: actor._id,
    };

    const existing = await BudgetRepository.findByProject(projectId);

    if (existing) {
      return BudgetRepository.updateById(existing._id, payload);
    }

    return BudgetRepository.create({
      ...payload,
      expenses: [],
    });
  }

  async addExpense(actor, projectId, data) {
    const { project } = await this.assertBudgetAccess(actor, projectId);

    let budget = await BudgetRepository.findByProject(projectId);

    if (!budget) {
      throw new ApiError(400, "Set project budget before adding expenses");
    }

    const expense = {
      date: data.date,
      category: data.category,
      amount: data.amount,
      description: data.description ?? "",
      createdBy: actor._id,
    };

    budget.expenses.push(expense);
    budget.updatedBy = actor._id;
    await budget.save();

    return budget.expenses[budget.expenses.length - 1];
  }

  async removeExpense(actor, projectId, expenseId) {
    await this.assertBudgetAccess(actor, projectId);

    const budget = await BudgetRepository.findByProject(projectId);

    if (!budget) {
      throw new ApiError(404, "Budget not found");
    }

    const expense = budget.expenses.id(expenseId);

    if (!expense) {
      throw new ApiError(404, "Expense not found");
    }

    expense.deleteOne();
    budget.updatedBy = actor._id;
    await budget.save();

    return { deleted: true };
  }

  async getAnalysis(actor, projectId) {
    const { project } = await this.assertBudgetAccess(actor, projectId);

    const budget = await BudgetRepository.findByProject(projectId);
    const { actualLaborCost, taskBreakdown } =
      await this.computeActualLabor(projectId);

    const expensesTotal = (budget?.expenses ?? []).reduce(
      (sum, expense) => sum + expense.amount,
      0
    );

    const totalSpent = expensesTotal + actualLaborCost;
    const allocatedAmount = budget?.allocatedAmount ?? 0;
    const estimatedCost = await EstimationService.computeGrandTotal(
      projectId,
      project.currency
    );

    const variance = allocatedAmount - totalSpent;
    const utilizationPercent =
      allocatedAmount > 0 ? (totalSpent / allocatedAmount) * 100 : 0;

    const estimateVariance = allocatedAmount - estimatedCost;

    const projectAgeMs = Date.now() - new Date(project.createdAt).getTime();
    const weeksElapsed = Math.max(1, projectAgeMs / (7 * 24 * 60 * 60 * 1000));
    const burnRatePerWeek = totalSpent / weeksElapsed;

    return {
      currency: budget?.currency ?? project.currency,
      allocatedAmount,
      estimatedCost,
      estimateVariance,
      actualLaborCost,
      expensesTotal,
      totalSpent,
      variance,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
      burnRatePerWeek: Math.round(burnRatePerWeek * 100) / 100,
      weeksElapsed: Math.round(weeksElapsed * 100) / 100,
      expenseCount: budget?.expenses?.length ?? 0,
      taskBreakdown,
      expenses: budget?.expenses ?? [],
    };
  }
}

export default new BudgetService();
