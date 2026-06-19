import express from "express";
import OrganizationController from "../controllers/OrganizationController.js";
import auth from "../middleware/auth.js";
import authorize from "../middleware/authorize.js";
import validate from "../middleware/validate.js";
import { createOrganizationSchema } from "../validators/organization.validator.js";

const organizationRouter = express.Router();

organizationRouter.use(auth);

organizationRouter.post(
  "/",
  authorize("CREATE_ORGANIZATION"),
  validate(createOrganizationSchema),
  OrganizationController.create
);

organizationRouter.get(
  "/me",
  authorize("VIEW_ORGANIZATION"),
  OrganizationController.getMine
);

organizationRouter.get(
  "/",
  authorize("LIST_ORGANIZATIONS"),
  OrganizationController.list
);

export default organizationRouter;
