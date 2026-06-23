import nodemailer from "nodemailer";

let transporter;

function normalizeSmtpPass(pass) {
  return pass.replace(/\s+/g, "");
}

function getTransporter() {
  if (transporter) {
    return transporter;
  }

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } =
    process.env;

  if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT ?? 587),
    secure: SMTP_SECURE === "true",
    auth: {
      user: SMTP_USER,
      pass: normalizeSmtpPass(SMTP_PASS),
    },
  });

  return transporter;
}

export function isMailConfigured() {
  return Boolean(
    process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS
  );
}

export async function sendOtpEmail({ to, name, otp }) {
  const from =
    process.env.SMTP_FROM ?? `"AgilePilot" <${process.env.SMTP_USER}>`;
  const subject = "Verify your AgilePilot account";
  const text = [
    `Hi ${name},`,
    "",
    "Your email verification code is:",
    "",
    otp,
    "",
    "This code expires in 10 minutes. If you did not request this, you can ignore this email.",
    "",
    "— AgilePilot",
  ].join("\n");

  const html = `
    <p>Hi ${name},</p>
    <p>Your email verification code is:</p>
    <p style="font-size:24px;font-weight:bold;letter-spacing:4px;">${otp}</p>
    <p>This code expires in 10 minutes. If you did not request this, you can ignore this email.</p>
    <p>— AgilePilot</p>
  `;

  const transport = getTransporter();

  if (!transport) {
    console.log(
      `[AgilePilot] SMTP not configured — OTP for ${to}: ${otp}`
    );
    return { delivered: false, devLogged: true, reason: "smtp_not_configured" };
  }

  try {
    await transport.sendMail({ from, to, subject, text, html });
    return { delivered: true, devLogged: false };
  } catch (error) {
    console.error(`[AgilePilot] SMTP send failed for ${to}:`, error.message);
    console.log(`[AgilePilot] OTP for ${to}: ${otp}`);
    return {
      delivered: false,
      devLogged: true,
      reason: "smtp_send_failed",
    };
  }
}
