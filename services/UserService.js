import { ORG_ROLES } from "../config/roles.js";
import OrganizationRepository from "../repositories/OrganizationRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";
import AuthService from "./AuthService.js";
import EmailVerificationService from "./EmailVerificationService.js";

class UserService {
  assertAdminHasOrganization(actor) {
    if (actor.orgRole === ORG_ROLES.ADMIN && !actor.organizationId) {
      throw new ApiError(400, "Create your organization before managing users");
    }
  }

  assertOrgAccess(actor, targetUser) {
    if (actor.orgRole === ORG_ROLES.SUPER_ADMIN) {
      return;
    }

    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "You do not have permission to manage users");
    }

    this.assertAdminHasOrganization(actor);

    if (
      !targetUser.organizationId ||
      actor.organizationId.toString() !== targetUser.organizationId.toString()
    ) {
      throw new ApiError(403, "You can only manage users in your organization");
    }
  }

  async createUser(actor, data) {
    const { name, email, password } = data;

    const emailTaken = await UserRepository.emailExists(email);

    if (emailTaken) {
      throw new ApiError(409, "Email already in use");
    }

    const passwordHash = await AuthService.hashPassword(password);

    if (actor.orgRole === ORG_ROLES.SUPER_ADMIN) {
      const user = await UserRepository.create({
        name,
        email,
        passwordHash,
        orgRole: ORG_ROLES.ADMIN,
        organizationId: null,
        isEmailVerified: false,
      });

      const verification = await EmailVerificationService.issueAndSendOtp(
        user._id,
        user.email,
        user.name
      );

      return { ...user.toSafeObject(), ...verification };
    }

    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "You do not have permission to create users");
    }

    this.assertAdminHasOrganization(actor);

    const organization = await OrganizationRepository.findById(actor.organizationId);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    const user = await UserRepository.create({
      name,
      email,
      passwordHash,
      orgRole: ORG_ROLES.MEMBER,
      organizationId: actor.organizationId,
      isEmailVerified: false,
    });

    const verification = await EmailVerificationService.issueAndSendOtp(
      user._id,
      user.email,
      user.name
    );

    return { ...user.toSafeObject(), ...verification };
  }

  async listUsers(actor) {
    if (actor.orgRole === ORG_ROLES.SUPER_ADMIN) {
      const users = await UserRepository.model
        .find({ orgRole: { $ne: ORG_ROLES.SUPER_ADMIN } })
        .select("-passwordHash");
      return users;
    }

    if (actor.orgRole === ORG_ROLES.ADMIN) {
      this.assertAdminHasOrganization(actor);
      return UserRepository.findByOrg(actor.organizationId);
    }

    throw new ApiError(403, "You do not have permission to list users");
  }

  async getUserById(actor, userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    this.assertOrgAccess(actor, user);

    return user.toSafeObject();
  }

  async updateUser(actor, userId, updates) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    this.assertOrgAccess(actor, user);

    if (updates.email && updates.email !== user.email) {
      const emailTaken = await UserRepository.emailExists(updates.email);
      if (emailTaken) {
        throw new ApiError(409, "Email already in use");
      }
      updates.isEmailVerified = false;
    }

    if (updates.password) {
      updates.passwordHash = await AuthService.hashPassword(updates.password);
      delete updates.password;
    }

    const updated = await UserRepository.updateById(userId, updates);

    if (updates.email && updates.email !== user.email) {
      await EmailVerificationService.issueAndSendOtp(
        updated._id,
        updated.email,
        updated.name
      );
    }

    return updated.toSafeObject();
  }

  async deactivateUser(actor, userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    this.assertOrgAccess(actor, user);

    if (user.orgRole === ORG_ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Cannot deactivate super admin");
    }

    if (user._id.toString() === actor._id.toString()) {
      throw new ApiError(400, "You cannot deactivate your own account");
    }

    const updated = await UserRepository.updateById(userId, { isActive: false });

    return updated.toSafeObject();
  }
}

export default new UserService();
