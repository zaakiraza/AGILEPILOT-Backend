import EmailOtp from "../models/EmailOtp.js";
import BaseRepository from "./BaseRepository.js";

class EmailOtpRepository extends BaseRepository {
  constructor() {
    super(EmailOtp);
  }

  async findActiveByUserId(userId) {
    return EmailOtp.findOne({
      userId,
      expiresAt: { $gt: new Date() },
    }).select("+otpHash");
  }

  async deleteByUserId(userId) {
    return EmailOtp.deleteMany({ userId });
  }
}

export default new EmailOtpRepository();
