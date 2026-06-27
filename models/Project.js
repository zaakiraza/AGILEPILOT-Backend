import mongoose from "mongoose";
import { PROJECT_STATUS_VALUES } from "../config/constants.js";

const projectSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    status: {
      type: String,
      enum: PROJECT_STATUS_VALUES,
      default: "planning",
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 3,
    },
    startDate: {
      type: Date,
      default: null,
    },
    endDate: {
      type: Date,
      default: null,
    },
    /** @deprecated Legacy field — PM is stored on ProjectMember. */
    projectManagerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

projectSchema.index({ organizationId: 1, name: 1 });

const Project = mongoose.model("Project", projectSchema);

export default Project;
