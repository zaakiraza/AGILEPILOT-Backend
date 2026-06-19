import mongoose from "mongoose";
import { ESTIMATE_LINE_CATEGORY_VALUES } from "../config/constants.js";

const lineItemSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ESTIMATE_LINE_CATEGORY_VALUES,
      required: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    quantity: {
      type: Number,
      required: true,
      min: 0,
    },
    unitCost: {
      type: Number,
      required: true,
      min: 0,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { _id: true }
);

const costEstimateSchema = new mongoose.Schema(
  {
    projectId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
      unique: true,
    },
    currency: {
      type: String,
      required: true,
      uppercase: true,
      maxlength: 3,
    },
    lineItems: {
      type: [lineItemSchema],
      default: [],
    },
    contingencyPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 2000,
      default: "",
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  { timestamps: true }
);

const CostEstimate = mongoose.model("CostEstimate", costEstimateSchema);

export default CostEstimate;
