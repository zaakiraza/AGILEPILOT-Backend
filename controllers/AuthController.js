import AuthService from "../services/AuthService.js";
import ResponseHandler from "../utils/ResponseHandler.js";

class AuthController {
  async login(req, res, next) {
    try {
      const { email, password } = req.validated.body;
      const result = await AuthService.login(email, password);
      return ResponseHandler.success(res, result, "Login successful", 200);
    } catch (error) {
      next(error);
    }
  }

  async me(req, res, next) {
    try {
      const user = await AuthService.getMe(req.user._id);
      return ResponseHandler.success(res, { user }, "Profile fetched", 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
