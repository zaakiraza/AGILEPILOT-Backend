import mongoose from "mongoose";
import { PROJECT_ROLES } from "../config/roles.js";

const projectMemberSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    projectRole: {
      type: String,
      enum: [
        PROJECT_ROLES.PROJECT_MANAGER,
        PROJECT_ROLES.TEAM_LEAD,
        PROJECT_ROLES.TEAM_MEMBER,
      ],
      required: true,
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

projectMemberSchema.index({ projectId: 1, userId: 1 }, { unique: true });
projectMemberSchema.index(
  { projectId: 1, projectRole: 1 },
  {
    unique: true,
    partialFilterExpression: { projectRole: PROJECT_ROLES.TEAM_LEAD },
  }
);
projectMemberSchema.index(
  { projectId: 1, projectRole: 1 },
  {
    unique: true,
    partialFilterExpression: { projectRole: PROJECT_ROLES.PROJECT_MANAGER },
  }
);

const ProjectMember = mongoose.model("ProjectMember", projectMemberSchema);

export default ProjectMember;
