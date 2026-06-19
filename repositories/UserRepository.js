import User from "../models/User.js";
import BaseRepository from "./BaseRepository.js";

class UserRepository extends BaseRepository {
  constructor() {
    super(User);
  }

  async findByEmail(email, includePassword = false) {
    const query = User.findOne({ email: email.toLowerCase() });
    if (includePassword) {
      query.select("+passwordHash");
    }
    return query;
  }

  async findByIdWithPassword(id) {
    return User.findById(id).select("+passwordHash");
  }

  async findByOrg(organizationId, filter = {}) {
    return User.find({ organizationId, ...filter }).select("-passwordHash");
  }

  async emailExists(email) {
    const user = await User.findOne({ email: email.toLowerCase() });
    return Boolean(user);
  }
}

export default new UserRepository();
