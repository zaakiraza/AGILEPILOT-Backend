import express from "express";
import AuthController from "../controllers/AuthController.js";
import auth from "../middleware/auth.js";
import validate from "../middleware/validate.js";
import { loginSchema } from "../validators/auth.validator.js";

const authRouter = express.Router();

authRouter.post("/login", validate(loginSchema), AuthController.login);
authRouter.get("/me", auth, AuthController.me);

export default authRouter;
