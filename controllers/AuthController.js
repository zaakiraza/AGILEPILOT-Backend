import AuthService from "../services/AuthService.js";
import EmailVerificationService from "../services/EmailVerificationService.js";
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

  async verifyEmail(req, res, next) {
    try {
      const { email, otp } = req.validated.body;
      const user = await EmailVerificationService.verifyEmail(email, otp);
      return ResponseHandler.success(
        res,
        { user },
        "Email verified successfully. You can now log in.",
        200
      );
    } catch (error) {
      next(error);
    }
  }

  async resendOtp(req, res, next) {
    try {
      const { email } = req.validated.body;
      const result = await EmailVerificationService.resendOtp(email);
      return ResponseHandler.success(res, result, result.message, 200);
    } catch (error) {
      next(error);
    }
  }
}

export default new AuthController();
