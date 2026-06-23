import { randomInt, randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

export function generateOtp(length = 6) {
  const min = 10 ** (length - 1);
  const max = 10 ** length;
  return String(randomInt(min, max));
}

export async function hashOtp(otp) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = await scryptAsync(otp, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

export async function verifyOtp(otp, otpHash) {
  const [salt, storedKey] = otpHash.split(":");

  if (!salt || !storedKey) {
    return false;
  }

  const derivedKey = await scryptAsync(otp, salt, 64);
  const storedBuffer = Buffer.from(storedKey, "hex");

  if (storedBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(storedBuffer, derivedKey);
}
