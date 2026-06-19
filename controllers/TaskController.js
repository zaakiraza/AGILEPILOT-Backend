import TaskService from "../services/TaskService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class TaskController {
  async create(req, res, next) {
    try {
      const task = await TaskService.createTask(
        req.user,
        req.validated.params.projectId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { task },
        "Task created successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async list(req, res, next) {
    try {
      const tasks = await TaskService.listTasks(
        req.user,
        req.validated.params.projectId,
        req.validated.query
      );
      return ResponseHandler.success(
        res,
        { tasks },
        "Tasks fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async getOne(req, res, next) {
    try {
      const task = await TaskService.getTask(
        req.user,
        req.validated.params.projectId,
        req.validated.params.taskId
      );
      return ResponseHandler.success(
        res,
        { task },
        "Task fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async update(req, res, next) {
    try {
      const task = await TaskService.updateTask(
        req.user,
        req.validated.params.projectId,
        req.validated.params.taskId,
        req.validated.body
      );
      return ResponseHandler.success(
        res,
        { task },
        "Task updated successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async remove(req, res, next) {
    try {
      const result = await TaskService.deleteTask(
        req.user,
        req.validated.params.projectId,
        req.validated.params.taskId
      );
      return ResponseHandler.success(
        res,
        result,
        "Task deleted successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async addComment(req, res, next) {
    try {
      const comment = await TaskService.addComment(
        req.user,
        req.validated.params.projectId,
        req.validated.params.taskId,
        req.validated.body.text
      );
      return ResponseHandler.success(
        res,
        { comment },
        "Comment added successfully",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async listComments(req, res, next) {
    try {
      const comments = await TaskService.listComments(
        req.user,
        req.validated.params.projectId,
        req.validated.params.taskId
      );
      return ResponseHandler.success(
        res,
        { comments },
        "Comments fetched successfully",
        200
      );
    } catch (error) {
      next(error);
    }
  }
}

export default new TaskController();
