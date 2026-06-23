import express from "express";
import AuthController from "../controllers/AuthController.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import {
  loginSchema,
  resendOtpSchema,
  verifyEmailSchema,
} from "../validators/auth.validator.js";

const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.post(
  "/verify-email",
  validate(verifyEmailSchema),
  AuthController.verifyEmail
);
authRouter.post(
  "/resend-otp",
  validate(resendOtpSchema),
  AuthController.resendOtp
);
authRouter.get("/me", auth, AuthController.me);

export default authRouter;
