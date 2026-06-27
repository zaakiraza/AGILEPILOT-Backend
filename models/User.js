import mongoose from "mongoose";
import { ORG_ROLE_VALUES, ORG_ROLES } from "../config/roles.js";

const userSchema = new mongoose.Schema(
  {
    organizationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Organization",
      required: function () {
        return [ORG_ROLES.MEMBER, "teamMember", "projectManager"].includes(
          this.orgRole
        );
      },
      default: null,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    orgRole: {
      type: String,
      enum: ORG_ROLE_VALUES,
      required: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

userSchema.index({ organizationId: 1, email: 1 });

userSchema.methods.toSafeObject = function () {
  const user = this.toObject();
  delete user.passwordHash;
  return user;
};

const User = mongoose.model("User", userSchema);

export default User;
