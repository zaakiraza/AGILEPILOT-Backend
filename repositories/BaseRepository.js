import ApiError from "../utils/ApiError.js";

class BaseRepository {
  constructor(model) {
    this.model = model;
  }

  async create(data) {
    return this.model.create(data);
  }

  async findById(id) {
    return this.model.findById(id);
  }

  async findByIdAndOrg(id, organizationId) {
    if (!organizationId) {
      throw new ApiError(400, "Organization context is required");
    }
    return this.model.findOne({ _id: id, organizationId });
  }

  async findByOrg(organizationId, filter = {}) {
    if (!organizationId) {
      throw new ApiError(400, "Organization context is required");
    }
    return this.model.find({ organizationId, ...filter });
  }

  async updateById(id, data) {
    return this.model.findByIdAndUpdate(id, data, {
      returnDocument: "after",
      runValidators: true,
    });
  }

  async deleteById(id) {
    return this.model.findByIdAndDelete(id);
  }
}

export default BaseRepository;
