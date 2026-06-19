import express from "express";
import userRoutes from "./UserRoutes.js";
import authRoutes from "./AuthRoutes.js";
import organizationRoutes from "./OrganizationRoutes.js";
import projectRoutes from "./ProjectRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/auth", authRoutes);
router.use("/organizations", organizationRoutes);
router.use("/projects", projectRoutes);

export default router;
