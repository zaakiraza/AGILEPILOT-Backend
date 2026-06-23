import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { JWT_EXPIRES_IN } from "../config/constants.js";
import { signToken } from "../utils/jwt.js";
import { ORG_ROLES } from "../config/roles.js";
import UserRepository from "../repositories/UserRepository.js";
import ApiError from "../utils/ApiError.js";

const scryptAsync = promisify(scrypt);

class AuthService {
  async hashPassword(password) {
    const salt = randomBytes(16).toString("hex");
    const derivedKey = await scryptAsync(password, salt, 64);
    return `${salt}:${derivedKey.toString("hex")}`;
  }

  async comparePassword(password, passwordHash) {
    const [salt, storedKey] = passwordHash.split(":");

    if (!salt || !storedKey) {
      return false;
    }

    const derivedKey = await scryptAsync(password, salt, 64);
    const storedBuffer = Buffer.from(storedKey, "hex");

    if (storedBuffer.length !== derivedKey.length) {
      return false;
    }

    return timingSafeEqual(storedBuffer, derivedKey);
  }

  generateToken(user) {
    return signToken(
      {
        userId: user._id.toString(),
        orgRole: user.orgRole,
        organizationId: user.organizationId?.toString() ?? null,
      },
      process.env.JWT_SECRET,
      JWT_EXPIRES_IN
    );
  }

  async login(email, password) {
    const user = await UserRepository.findByEmail(email, true);

    if (!user || !user.isActive) {
      throw new ApiError(401, "Invalid email or password");
    }

    if (user.isEmailVerified === false) {
      throw new ApiError(
        403,
        "Email not verified. Check your inbox for the OTP or request a new code at POST /api/auth/resend-otp"
      );
    }

    const isMatch = await this.comparePassword(password, user.passwordHash);

    if (!isMatch) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = this.generateToken(user);

    return {
      token,
      user: user.toSafeObject(),
    };
  }

  async getMe(userId) {
    const user = await UserRepository.findById(userId);

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return user.toSafeObject();
  }

  async seedSuperAdmin({ name, email, password }) {
    const existing = await UserRepository.findByEmail(email);

    if (existing) {
      throw new ApiError(409, "Super admin already exists with this email");
    }

    const passwordHash = await this.hashPassword(password);

    const user = await UserRepository.create({
      name,
      email,
      passwordHash,
      orgRole: ORG_ROLES.SUPER_ADMIN,
      organizationId: null,
      isEmailVerified: true,
    });

    return user.toSafeObject();
  }
}

export default new AuthService();
