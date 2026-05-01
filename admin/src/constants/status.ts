export const ROUTE_STATUS = {
  ACTIVE: 'active',
  INACTIVE: 'inactive',
} as const;

export const VISIT_STATUS = {
  PENDING: 'pending',
  COMPLETE: 'complete',
  MISSED: 'missed',
  ZERO_SALES: 'zero_sales',
} as const;

export type RouteStatus = (typeof ROUTE_STATUS)[keyof typeof ROUTE_STATUS];
export type VisitStatus = (typeof VISIT_STATUS)[keyof typeof VISIT_STATUS];
