/** Platform / organization identity only — not project roles. */
export const ORG_ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  MEMBER: "member",
};

/** Per-project roles stored on ProjectMember. */
export const PROJECT_ROLES = {
  PROJECT_MANAGER: "projectManager",
  TEAM_LEAD: "teamLead",
  TEAM_MEMBER: "teamMember",
};

export const ORG_ROLE_VALUES = [
  ...Object.values(ORG_ROLES),
  "teamMember",
  "projectManager",
];
export const PROJECT_ROLE_VALUES = Object.values(PROJECT_ROLES);

export const ASSIGNABLE_ORG_ROLES = [ORG_ROLES.ADMIN, ORG_ROLES.MEMBER];
