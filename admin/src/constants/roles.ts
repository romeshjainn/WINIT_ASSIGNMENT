export const ROLES = {
  ADMIN: 'admin',
  GENERAL_MANAGER: 'general_manager',
  TEAM_LEAD: 'team_lead',
  SALES_EXECUTIVE: 'van_sales_user',
  VAN_SALES_USER: 'van_sales_user',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_OPTIONS: { label: string; value: string }[] = [
  { label: 'General Manager', value: ROLES.GENERAL_MANAGER },
  { label: 'Team Lead', value: ROLES.TEAM_LEAD },
  { label: 'Sales Executive', value: ROLES.SALES_EXECUTIVE },
];

export const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  general_manager: 'General Manager',
  team_lead: 'Team Lead',
  van_sales_user: 'Sales Executive',
};
