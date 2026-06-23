import {
  OTP_EXPIRES_MINUTES,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
} from "../config/constants.js";
import EmailOtpRepository from "../repositories/EmailOtpRepository.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";
import { sendOtpEmail, isMailConfigured } from "../utils/mailer.js";
import { generateOtp, hashOtp, verifyOtp } from "../utils/otp.js";

class EmailVerificationService {
  getExpiresAt() {
    return new Date(Date.now() + OTP_EXPIRES_MINUTES * 60 * 1000);
  }

  assertResendCooldown(lastSentAt) {
    if (!lastSentAt) {
      return;
    }

    const elapsedSeconds = (Date.now() - new Date(lastSentAt).getTime()) / 1000;

    if (elapsedSeconds < OTP_RESEND_COOLDOWN_SECONDS) {
      const wait = Math.ceil(OTP_RESEND_COOLDOWN_SECONDS - elapsedSeconds);
      throw new ApiError(
        429,
        `Please wait ${wait} seconds before requesting another code`
      );
    }
  }

  async issueAndSendOtp(userId, email, name, { checkCooldown = false } = {}) {
    const existing = await EmailOtpRepository.findActiveByUserId(userId);

    if (checkCooldown && existing) {
      this.assertResendCooldown(existing.lastSentAt);
    }

    await EmailOtpRepository.deleteByUserId(userId);

    const otp = generateOtp(OTP_LENGTH);
    const otpHash = await hashOtp(otp);
    const expiresAt = this.getExpiresAt();

    await EmailOtpRepository.create({
      userId,
      otpHash,
      expiresAt,
      attempts: 0,
      lastSentAt: new Date(),
    });

    const mailResult = await sendOtpEmail({ to: email, name, otp });

    const response = {
      emailVerificationSent: true,
      emailDelivered: mailResult.delivered,
    };

    const exposeDevOtp =
      process.env.DEV_EXPOSE_OTP === "true" &&
      (process.env.NODE_ENV !== "production" ||
        !mailResult.delivered);

    if (exposeDevOtp) {
      response.devOtp = otp;
    }

    return response;
  }

  async verifyEmail(email, otp) {
    const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new ApiError(400, "Invalid email or verification code");
    }

    if (user.isEmailVerified !== false) {
      throw new ApiError(400, "Email is already verified");
    }

    if (!user.isActive) {
      throw new ApiError(403, "Account is deactivated");
    }

    const record = await EmailOtpRepository.findActiveByUserId(user._id);

    if (!record) {
      throw new ApiError(400, "Verification code expired. Request a new one.");
    }

    if (record.attempts >= OTP_MAX_ATTEMPTS) {
      await EmailOtpRepository.deleteByUserId(user._id);
      throw new ApiError(
        429,
        "Too many failed attempts. Request a new verification code."
      );
    }

    const isValid = await verifyOtp(otp, record.otpHash);

    if (!isValid) {
      await EmailOtpRepository.updateById(record._id, {
        attempts: record.attempts + 1,
      });
      throw new ApiError(400, "Invalid email or verification code");
    }

    await UserRepository.updateById(user._id, { isEmailVerified: true });
    await EmailOtpRepository.deleteByUserId(user._id);

    return user.toSafeObject();
  }

  async resendOtp(email) {
    const user = await UserRepository.findByEmail(email);

    if (!user || user.isEmailVerified !== false || !user.isActive) {
      return {
        message: "If an unverified account exists, a new code has been sent.",
        emailVerificationSent: true,
      };
    }

    const mailMeta = await this.issueAndSendOtp(user._id, user.email, user.name, {
      checkCooldown: true,
    });

    return {
      message: "If an unverified account exists, a new code has been sent.",
      ...mailMeta,
    };
  }
}

export default new EmailVerificationService();
