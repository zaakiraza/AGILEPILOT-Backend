import CostEstimate from "../models/CostEstimate.js";
import BaseRepository from "./BaseRepository.js";

class CostEstimateRepository extends BaseRepository {
  constructor() {
    super(CostEstimate);
  }

  async findByProject(projectId) {
    return CostEstimate.findOne({ projectId });
  }
}

export default new CostEstimateRepository();
