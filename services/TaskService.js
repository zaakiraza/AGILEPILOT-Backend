import { PROJECT_ROLES } from "../config/roles.js";
import MilestoneRepository from "../repositories/MilestoneRepository.js";
import ProjectMemberRepository from "../repositories/ProjectMemberRepository.js";
import TaskCommentRepository from "../repositories/TaskCommentRepository.js";
import TaskRepository from "../repositories/TaskRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";
import ProjectService from "./ProjectService.js";

const MANAGE_ROLES = ["admin", PROJECT_ROLES.PROJECT_MANAGER, PROJECT_ROLES.TEAM_LEAD];
const VIEW_ROLES = [
  "admin",
  PROJECT_ROLES.PROJECT_MANAGER,
  PROJECT_ROLES.TEAM_LEAD,
  PROJECT_ROLES.TEAM_MEMBER,
];

const MEMBER_UPDATABLE_FIELDS = ["status", "actualHours"];

class TaskService {
  async validateMilestone(projectId, milestoneId) {
    const milestone = await MilestoneRepository.findByProjectAndId(
      projectId,
      milestoneId
    );

    if (!milestone) {
      throw new ApiError(404, "Milestone not found in this project");
    }

    return milestone;
  }

  async validateAssignee(projectId, assigneeId, project) {
    if (!assigneeId) {
      return null;
    }

    const user = await UserRepository.findById(assigneeId);

    if (!user || !user.isActive) {
      throw new ApiError(404, "Assignee not found");
    }

    if (user.organizationId?.toString() !== project.organizationId.toString()) {
      throw new ApiError(400, "Assignee must belong to the same organization");
    }

    const isPm =
      project.projectManagerId._id?.toString() === assigneeId ||
      project.projectManagerId.toString() === assigneeId;

    const membership = await ProjectMemberRepository.findByProjectAndUser(
      projectId,
      assigneeId
    );

    if (!isPm && !membership) {
      throw new ApiError(400, "Assignee must be a member of this project");
    }

    return user;
  }

  async validateParentTask(projectId, parentTaskId) {
    if (!parentTaskId) {
      return null;
    }

    const parent = await TaskRepository.findByProjectAndId(projectId, parentTaskId);

    if (!parent) {
      throw new ApiError(404, "Parent task not found in this project");
    }

    if (parent.parentTaskId) {
      throw new ApiError(400, "Subtasks cannot have nested subtasks");
    }

    return parent;
  }

  async validateDependencies(projectId, taskId, dependsOn = []) {
    if (!dependsOn.length) {
      return;
    }

    const uniqueDeps = [...new Set(dependsOn.map((id) => id.toString()))];

    if (taskId && uniqueDeps.includes(taskId.toString())) {
      throw new ApiError(400, "A task cannot depend on itself");
    }

    for (const depId of uniqueDeps) {
      const depTask = await TaskRepository.findByProjectAndId(projectId, depId);

      if (!depTask) {
        throw new ApiError(404, `Dependency task ${depId} not found in this project`);
      }
    }

    if (taskId) {
      const createsCycle = await this.wouldCreateCycle(projectId, taskId, uniqueDeps);

      if (createsCycle) {
        throw new ApiError(400, "Task dependencies would create a circular reference");
      }
    }
  }

  async wouldCreateCycle(projectId, taskId, newDependsOn) {
    const allTasks = await TaskRepository.findByProject(projectId);
    const graph = new Map();

    for (const task of allTasks) {
      graph.set(task._id.toString(), task.dependsOn.map((d) => d.toString()));
    }

    graph.set(taskId.toString(), newDependsOn);

    const visited = new Set();
    const stack = new Set();

    const dfs = (node) => {
      if (stack.has(node)) {
        return true;
      }
      if (visited.has(node)) {
        return false;
      }

      visited.add(node);
      stack.add(node);

      for (const dep of graph.get(node) ?? []) {
        if (dfs(dep)) {
          return true;
        }
      }

      stack.delete(node);
      return false;
    };

    for (const node of graph.keys()) {
      if (dfs(node)) {
        return true;
      }
    }

    return false;
  }

  isAssignee(task, userId) {
    if (!task.assigneeId) {
      return false;
    }

    const assigneeId =
      task.assigneeId._id?.toString() ?? task.assigneeId.toString();

    return assigneeId === userId.toString();
  }

  async createTask(actor, projectId, data) {
    const { project } = await ProjectService.assertProjectAccess(
      actor,
      projectId,
      MANAGE_ROLES
    );

    await this.validateMilestone(projectId, data.milestoneId);

    const parent = await this.validateParentTask(projectId, data.parentTaskId);

    if (parent && parent.milestoneId.toString() !== data.milestoneId) {
      throw new ApiError(400, "Subtask must belong to the same milestone as parent");
    }

    await this.validateAssignee(projectId, data.assigneeId, project);
    await this.validateDependencies(projectId, null, data.dependsOn ?? []);

    const order =
      data.order ??
      (await TaskRepository.getMaxOrder(projectId, data.milestoneId)) + 1;

    const task = await TaskRepository.create({
      projectId,
      milestoneId: data.milestoneId,
      title: data.title,
      description: data.description,
      status: data.status,
      priority: data.priority,
      assigneeId: data.assigneeId ?? null,
      estimatedHours: data.estimatedHours ?? 0,
      actualHours: data.actualHours ?? 0,
      hourlyRate: data.hourlyRate ?? 0,
      parentTaskId: data.parentTaskId ?? null,
      dependsOn: data.dependsOn ?? [],
      order,
      createdBy: actor._id,
    });

    return TaskRepository.findByProjectAndId(projectId, task._id);
  }

  async listTasks(actor, projectId, { milestoneId } = {}) {
    await ProjectService.assertProjectAccess(actor, projectId, VIEW_ROLES);

    const filter = milestoneId ? { milestoneId } : {};

    if (milestoneId) {
      await this.validateMilestone(projectId, milestoneId);
    }

    return TaskRepository.findByProject(projectId, filter);
  }

  async getTask(actor, projectId, taskId) {
    await ProjectService.assertProjectAccess(actor, projectId, VIEW_ROLES);

    const task = await TaskRepository.findByProjectAndId(projectId, taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    return task;
  }

  async updateTask(actor, projectId, taskId, updates) {
    const { project, projectRole } = await ProjectService.assertProjectAccess(
      actor,
      projectId
    );

    const task = await TaskRepository.findByProjectAndId(projectId, taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const isManager = MANAGE_ROLES.includes(projectRole);
    const isOwnTask = this.isAssignee(task, actor._id);

    if (!isManager && !(projectRole === PROJECT_ROLES.TEAM_MEMBER && isOwnTask)) {
      throw new ApiError(403, "You do not have permission to update this task");
    }

    if (!isManager) {
      const invalidFields = Object.keys(updates).filter(
        (key) => !MEMBER_UPDATABLE_FIELDS.includes(key)
      );

      if (invalidFields.length) {
        throw new ApiError(
          403,
          `Team members can only update: ${MEMBER_UPDATABLE_FIELDS.join(", ")}`
        );
      }
    }

    if (updates.milestoneId) {
      await this.validateMilestone(projectId, updates.milestoneId);
    }

    if (updates.parentTaskId) {
      const parent = await this.validateParentTask(projectId, updates.parentTaskId);

      if (parent._id.toString() === taskId) {
        throw new ApiError(400, "A task cannot be its own parent");
      }
    }

    if (updates.assigneeId !== undefined) {
      await this.validateAssignee(projectId, updates.assigneeId, project);
    }

    if (updates.dependsOn) {
      await this.validateDependencies(projectId, taskId, updates.dependsOn);
    }

    const updated = await TaskRepository.updateById(taskId, updates);

    return TaskRepository.findByProjectAndId(projectId, updated._id);
  }

  async deleteTask(actor, projectId, taskId) {
    await ProjectService.assertProjectAccess(actor, projectId, MANAGE_ROLES);

    const task = await TaskRepository.findByProjectAndId(projectId, taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const subtasks = await TaskRepository.findSubtasks(taskId);

    if (subtasks.length) {
      throw new ApiError(400, "Delete subtasks before deleting this task");
    }

    await TaskCommentRepository.model.deleteMany({ taskId });
    await TaskRepository.deleteById(taskId);

    return { deleted: true };
  }

  async addComment(actor, projectId, taskId, text) {
    const { projectRole } = await ProjectService.assertProjectAccess(
      actor,
      projectId
    );

    const task = await TaskRepository.findByProjectAndId(projectId, taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const isManager = MANAGE_ROLES.includes(projectRole);
    const isOwnTask = this.isAssignee(task, actor._id);

    if (!isManager && !(projectRole === PROJECT_ROLES.TEAM_MEMBER && isOwnTask)) {
      throw new ApiError(
        403,
        "You can only comment on your own assigned tasks"
      );
    }

    const comment = await TaskCommentRepository.create({
      taskId,
      userId: actor._id,
      text,
    });

    return TaskCommentRepository.model
      .findById(comment._id)
      .populate("userId", "name email orgRole");
  }

  async listComments(actor, projectId, taskId) {
    await ProjectService.assertProjectAccess(actor, projectId, VIEW_ROLES);

    const task = await TaskRepository.findByProjectAndId(projectId, taskId);

    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    const comments = await TaskCommentRepository.findByTask(taskId);

    return comments;
  }
}

export default new TaskService();
