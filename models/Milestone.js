import mongoose from "mongoose";
import { MILESTONE_STATUS_VALUES } from "../config/constants.js";

const milestoneSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 300,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    dueDate: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: MILESTONE_STATUS_VALUES,
      default: "pending",
    },
    order: {
      type: Number,
      required: true,
      min: 0,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

milestoneSchema.index({ projectId: 1, order: 1 });

const Milestone = mongoose.model("Milestone", milestoneSchema);

export default Milestone;
