import UserService from "../services/UserService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class UserController {
  async createUser(req, res, next) {
    try {
      const user = await UserService.createUser(req.user, req.validated.body);
      return ResponseHandler.success(
        res,
        { user },
        "User created. Verification OTP sent to email.",
        201
      );
    } catch (error) {
      next(error);
    }
  }

  async listUsers(req, res, next) {
    try {
      const users = await UserService.listUsers(req.user);
      return ResponseHandler.success(res, { users }, "Users fetched successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async getUser(req, res, next) {
    try {
      const user = await UserService.getUserById(req.user, req.validated.params.id);
      return ResponseHandler.success(res, { user }, "User fetched successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(
        req.user,
        req.validated.params.id,
        req.validated.body
      );
      return ResponseHandler.success(res, { user }, "User updated successfully", 200);
    } catch (error) {
      next(error);
    }
  }

  async deactivateUser(req, res, next) {
    try {
      const user = await UserService.deactivateUser(
        req.user,
        req.validated.params.id
      );
      return ResponseHandler.success(res, { user }, "User deactivated successfully", 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new UserController();
