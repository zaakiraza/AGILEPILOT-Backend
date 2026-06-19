import mongoose from "mongoose";

const organizationSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    settings: {
      defaultCurrency: {
        type: String,
        default: "USD",
        uppercase: true,
        maxlength: 3,
      },
    },
  },
  { timestamps: true }
);

const Organization = mongoose.model("Organization", organizationSchema);

export default Organization;
