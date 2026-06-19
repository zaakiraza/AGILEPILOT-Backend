import BudgetService from "../services/BudgetService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class BudgetController {
  async get(req, res, next) {
    try {
      const data = await BudgetService.getBudget(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        data,
        "Budget fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async upsert(req, res, next) {
    try {
      const budget = await BudgetService.upsertBudget(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { budget },
        "Budget saved successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async addExpense(req, res, next) {
    try {
      const expense = await BudgetService.addExpense(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { expense },
        "Expense added successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async removeExpense(req, res, next) {
    try {
      const result = await BudgetService.removeExpense(
        req.user,
        req.validated.params.projectId,
        req.validated.params.expenseId
      );
      return ResponseHandler.success(
        res,
        result,
        "Expense removed successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async analysis(req, res, next) {
    try {
      const analysis = await BudgetService.getAnalysis(
        req.user,
        req.validated.params.projectId
      );
      return ResponseHandler.success(
        res,
        { analysis },
        "Budget analysis fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new BudgetController();
