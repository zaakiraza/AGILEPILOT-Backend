import express from "express";
import BudgetController from "../controllers/BudgetController.js";
import EstimateController from "../controllers/EstimateController.js";
import MilestoneController from "../controllers/MilestoneController.js";
import ProjectController from "../controllers/ProjectController.js";
import ReportController from "../controllers/ReportController.js";
import TaskController from "../controllers/TaskController.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import {
  addExpenseSchema,
  budgetProjectParamSchema,
  expenseIdParamSchema,
  upsertBudgetSchema,
} from "../validators/budget.validator.js";
import {
  estimateProjectParamSchema,
  upsertEstimateSchema,
} from "../validators/estimate.validator.js";
import {
  createMilestoneSchema,
  listMilestonesSchema,
  milestoneIdParamSchema,
  updateMilestoneSchema,
} from "../validators/milestone.validator.js";
import {
  addMemberSchema,
  changeManagerSchema,
  createProjectSchema,
  memberUserIdParamSchema,
  projectIdParamSchema,
  updateProjectSchema,
} from "../validators/project.validator.js";
import {
  createReportSchema,
  exportReportSchema,
  listReportsSchema,
  reportIdParamSchema,
} from "../validators/report.validator.js";
import {
  createCommentSchema,
  createTaskSchema,
  listCommentsSchema,
  listTasksSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "../validators/task.validator.js";

const projectRouter = express.Router();

projectRouter.use(auth);

projectRouter.post(
  "/",
  authorize("CREATE_PROJECT"),
  validate(createProjectSchema),
  ProjectController.create
);

projectRouter.get("/", ProjectController.list);

projectRouter.get(
  "/:projectId",
  validate(projectIdParamSchema),
  ProjectController.getOne
);

projectRouter.put(
  "/:projectId",
  validate(updateProjectSchema),
  ProjectController.update
);

projectRouter.patch(
  "/:projectId/change-manager",
  authorize("CREATE_PROJECT"),
  validate(changeManagerSchema),
  ProjectController.changeManager
);

projectRouter.delete(
  "/:projectId",
  authorize("CREATE_PROJECT"),
  validate(projectIdParamSchema),
  ProjectController.remove
);

projectRouter.get(
  "/:projectId/members",
  validate(projectIdParamSchema),
  ProjectController.listMembers
);

projectRouter.post(
  "/:projectId/members",
  validate(addMemberSchema),
  ProjectController.addMember
);

projectRouter.delete(
  "/:projectId/members/:userId",
  validate(memberUserIdParamSchema),
  ProjectController.removeMember
);

projectRouter.patch(
  "/:projectId/members/:userId/promote-lead",
  validate(memberUserIdParamSchema),
  ProjectController.promoteLead
);

projectRouter.patch(
  "/:projectId/members/:userId/demote-lead",
  validate(memberUserIdParamSchema),
  ProjectController.demoteLead
);

projectRouter.post(
  "/:projectId/milestones",
  validate(createMilestoneSchema),
  MilestoneController.create
);

projectRouter.get(
  "/:projectId/milestones",
  validate(listMilestonesSchema),
  MilestoneController.list
);

projectRouter.get(
  "/:projectId/milestones/:milestoneId",
  validate(milestoneIdParamSchema),
  MilestoneController.getOne
);

projectRouter.put(
  "/:projectId/milestones/:milestoneId",
  validate(updateMilestoneSchema),
  MilestoneController.update
);

projectRouter.delete(
  "/:projectId/milestones/:milestoneId",
  validate(milestoneIdParamSchema),
  MilestoneController.remove
);

projectRouter.post(
  "/:projectId/tasks",
  validate(createTaskSchema),
  TaskController.create
);

projectRouter.get(
  "/:projectId/tasks",
  validate(listTasksSchema),
  TaskController.list
);

projectRouter.get(
  "/:projectId/tasks/:taskId",
  validate(taskIdParamSchema),
  TaskController.getOne
);

projectRouter.put(
  "/:projectId/tasks/:taskId",
  validate(updateTaskSchema),
  TaskController.update
);

projectRouter.delete(
  "/:projectId/tasks/:taskId",
  validate(taskIdParamSchema),
  TaskController.remove
);

projectRouter.post(
  "/:projectId/tasks/:taskId/comments",
  validate(createCommentSchema),
  TaskController.addComment
);

projectRouter.get(
  "/:projectId/tasks/:taskId/comments",
  validate(listCommentsSchema),
  TaskController.listComments
);

projectRouter.get(
  "/:projectId/estimate/summary",
  validate(estimateProjectParamSchema),
  EstimateController.summary
);

projectRouter.get(
  "/:projectId/estimate",
  validate(estimateProjectParamSchema),
  EstimateController.get
);

projectRouter.put(
  "/:projectId/estimate",
  validate(upsertEstimateSchema),
  EstimateController.upsert
);

projectRouter.get(
  "/:projectId/budget/analysis",
  validate(budgetProjectParamSchema),
  BudgetController.analysis
);

projectRouter.get(
  "/:projectId/budget",
  validate(budgetProjectParamSchema),
  BudgetController.get
);

projectRouter.put(
  "/:projectId/budget",
  validate(upsertBudgetSchema),
  BudgetController.upsert
);

projectRouter.post(
  "/:projectId/budget/expenses",
  validate(addExpenseSchema),
  BudgetController.addExpense
);

projectRouter.delete(
  "/:projectId/budget/expenses/:expenseId",
  validate(expenseIdParamSchema),
  BudgetController.removeExpense
);

projectRouter.post(
  "/:projectId/reports",
  validate(createReportSchema),
  ReportController.create
);

projectRouter.get(
  "/:projectId/reports",
  validate(listReportsSchema),
  ReportController.list
);

projectRouter.get(
  "/:projectId/reports/:reportId/export",
  validate(exportReportSchema),
  ReportController.export
);

projectRouter.get(
  "/:projectId/reports/:reportId",
  validate(reportIdParamSchema),
  ReportController.getOne
);

export default projectRouter;
