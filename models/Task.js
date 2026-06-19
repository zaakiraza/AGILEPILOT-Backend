import mongoose from "mongoose";
import { TASK_PRIORITY_VALUES, TASK_STATUS_VALUES } from "../config/constants.js";

const taskSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      index: true,
    },
    milestoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Milestone",
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
      maxlength: 5000,
      default: "",
    },
    status: {
      type: String,
      enum: TASK_STATUS_VALUES,
      default: "todo",
    },
    priority: {
      type: String,
      enum: TASK_PRIORITY_VALUES,
      default: "medium",
    },
    assigneeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    estimatedHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    actualHours: {
      type: Number,
      min: 0,
      default: 0,
    },
    hourlyRate: {
      type: Number,
      min: 0,
      default: 0,
    },
    parentTaskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    dependsOn: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Task",
      },
    ],
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

taskSchema.index({ projectId: 1, milestoneId: 1, order: 1 });
taskSchema.index({ projectId: 1, assigneeId: 1 });

const Task = mongoose.model("Task", taskSchema);

export default Task;
