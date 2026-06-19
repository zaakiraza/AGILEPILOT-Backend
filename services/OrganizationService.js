import { ORG_ROLES } from "../config/roles.js";
import OrganizationRepository from "../repositories/OrganizationRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";

class OrganizationService {
  slugify(text) {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }

  async createOrganization(actor, { name, slug, defaultCurrency }) {
    if (actor.orgRole !== ORG_ROLES.ADMIN) {
      throw new ApiError(403, "Only admin can create an organization");
    }

    if (actor.organizationId) {
      throw new ApiError(409, "You already belong to an organization");
    }

    const resolvedSlug = slug ?? this.slugify(name);
    const slugTaken = await OrganizationRepository.findBySlug(resolvedSlug);

    if (slugTaken) {
      throw new ApiError(409, "Organization slug already exists");
    }

    const organization = await OrganizationRepository.create({
      name,
      slug: resolvedSlug,
      createdBy: actor._id,
      ...(defaultCurrency && {
        settings: { defaultCurrency: defaultCurrency.toUpperCase() },
      }),
    });

    const updatedAdmin = await UserRepository.updateById(actor._id, {
      organizationId: organization._id,
    });

    return {
      organization,
      admin: updatedAdmin.toSafeObject(),
    };
  }

  async getMyOrganization(actor) {
    if (actor.orgRole === ORG_ROLES.SUPER_ADMIN) {
      throw new ApiError(400, "Super admin is not linked to an organization");
    }

    if (!actor.organizationId) {
      throw new ApiError(404, "You have not created an organization yet");
    }

    const organization = await OrganizationRepository.findById(actor.organizationId);

    if (!organization) {
      throw new ApiError(404, "Organization not found");
    }

    return organization;
  }

  async listOrganizations(actor) {
    if (actor.orgRole !== ORG_ROLES.SUPER_ADMIN) {
      throw new ApiError(403, "Only super admin can list all organizations");
    }

    return OrganizationRepository.model.find().sort({ createdAt: -1 });
  }
}

export default new OrganizationService();
