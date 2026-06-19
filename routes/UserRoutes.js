import express from "express";
import UserController from "../controllers/User.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import {
  createUserSchema,
  updateUserSchema,
  userIdParamSchema,
} from "../validators/user.validator.js";

const userRouter = express.Router();

userRouter.use(auth);

userRouter.post(
  "/",
  authorize("CREATE_USER"),
  validate(createUserSchema),
  UserController.createUser
);

userRouter.get("/", authorize("MANAGE_USERS"), UserController.listUsers);

userRouter.get(
  "/:id",
  authorize("MANAGE_USERS"),
  validate(userIdParamSchema),
  UserController.getUser
);

userRouter.put(
  "/:id",
  authorize("MANAGE_USERS"),
  validate(updateUserSchema),
  UserController.updateUser
);

userRouter.patch(
  "/:id/deactivate",
  authorize("MANAGE_USERS"),
  validate(userIdParamSchema),
  UserController.deactivateUser
);

export default userRouter;
