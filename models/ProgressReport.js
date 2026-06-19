import mongoose from "mongoose";

const progressReportSchema = new mongoose.Schema(
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
      default: null,
    },
    taskId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      default: null,
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    periodStart: {
      type: Date,
      required: true,
    },
    periodEnd: {
      type: Date,
      required: true,
    },
    manualNotes: {
      type: String,
      trim: true,
      maxlength: 5000,
      default: "",
    },
    autoCompletionPercent: {
      type: Number,
      required: true,
      min: 0,
      max: 100,
    },
    combinedSummary: {
      type: String,
      trim: true,
      maxlength: 6000,
      default: "",
    },
  },
  { timestamps: true }
);

progressReportSchema.index({ projectId: 1, createdAt: -1 });

const ProgressReport = mongoose.model("ProgressReport", progressReportSchema);

export default ProgressReport;
