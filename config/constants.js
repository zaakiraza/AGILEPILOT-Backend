export const JWT_EXPIRES_IN = "7d";

export const OTP_LENGTH = 6;
export const OTP_EXPIRES_MINUTES = 10;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;

export const PROJECT_STATUS = {
  PLANNING: "planning",
  ACTIVE: "active",
  ON_HOLD: "on_hold",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
};

export const PROJECT_STATUS_VALUES = Object.values(PROJECT_STATUS);

export const MILESTONE_STATUS = {
  PENDING: "pending",
  IN_PROGRESS: "in_progress",
  COMPLETED: "completed",
};

export const MILESTONE_STATUS_VALUES = Object.values(MILESTONE_STATUS);

export const TASK_STATUS = {
  TODO: "todo",
  IN_PROGRESS: "in_progress",
  DONE: "done",
};

export const TASK_STATUS_VALUES = Object.values(TASK_STATUS);

export const TASK_PRIORITY = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
};

export const TASK_PRIORITY_VALUES = Object.values(TASK_PRIORITY);

export const ESTIMATE_LINE_CATEGORIES = {
  LABOR: "labor",
  MATERIALS: "materials",
  SOFTWARE: "software",
  TRAVEL: "travel",
  OVERHEAD: "overhead",
  OTHER: "other",
};

export const ESTIMATE_LINE_CATEGORY_VALUES = Object.values(ESTIMATE_LINE_CATEGORIES);
