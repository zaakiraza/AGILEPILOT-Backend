import Organization from "../models/Organization.js";
import BaseRepository from "./BaseRepository.js";

class OrganizationRepository extends BaseRepository {
  constructor() {
    super(Organization);
  }

  async findBySlug(slug) {
    return Organization.findOne({ slug: slug.toLowerCase() });
  }
}

export default new OrganizationRepository();
