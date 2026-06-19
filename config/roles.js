export const ORG_ROLES = {
  SUPER_ADMIN: "superAdmin",
  ADMIN: "admin",
  PROJECT_MANAGER: "projectManager",
  TEAM_MEMBER: "teamMember",
};

export const PROJECT_ROLES = {
  PROJECT_MANAGER: "projectManager",
  TEAM_LEAD: "teamLead",
  TEAM_MEMBER: "teamMember",
};

export const ORG_ROLE_VALUES = Object.values(ORG_ROLES);
export const ASSIGNABLE_ORG_ROLES = [
  ORG_ROLES.ADMIN,
  ORG_ROLES.PROJECT_MANAGER,
  ORG_ROLES.TEAM_MEMBER,
];
