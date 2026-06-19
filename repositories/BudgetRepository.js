import Budget from "../models/Budget.js";
import BaseRepository from "./BaseRepository.js";

class BudgetRepository extends BaseRepository {
  constructor() {
    super(Budget);
  }

  async findByProject(projectId) {
    return Budget.findOne({ projectId });
  }
}

export default new BudgetRepository();
