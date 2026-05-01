export const API = {
  AUTH: {
    LOGIN: '/auth/login',
  },
  COMPANIES: {
    LIST: '/companies',
  },
  WAREHOUSES: {
    LIST: '/warehouses',
  },
  VEHICLES: {
    LIST: '/vehicles',
  },
  USERS: {
    LIST: '/users',
    CREATE: '/users',
    DETAIL: (id: string) => `/users/${id}`,
    UPDATE: (id: string) => `/users/${id}`,
    DELETE: (id: string) => `/users/${id}`,
  },
  CUSTOMERS: {
    LIST: '/customers',
    CREATE: '/customers',
    DETAIL: (id: string) => `/customers/${id}`,
    UPDATE: (id: string) => `/customers/${id}`,
    DELETE: (id: string) => `/customers/${id}`,
    IMPORT: '/customers/import',
    EXPORT: '/customers/export',
  },
  ROUTES: {
    LIST: '/routes',
    CREATE: '/routes',
    DETAIL: (id: string) => `/routes/${id}`,
    UPDATE: (id: string) => `/routes/${id}`,
    DELETE: (id: string) => `/routes/${id}`,
  },
  JOURNEY_PLANS: {
    LIST: '/journey-plans',
    CREATE: '/journey-plans',
    DETAIL: (id: string) => `/journey-plans/${id}`,
    UPDATE: (id: string) => `/journey-plans/${id}`,
    DELETE: (id: string) => `/journey-plans/${id}`,
    TODAY: '/journey-plans/today',
  },
  VISITS: {
    LIST: '/visits',
    COMPLETE: (id: string) => `/visits/${id}/complete`,
    NOTES: (id: string) => `/visits/${id}/notes`,
    SALES_ORDER: (id: string) => `/visits/${id}/sales-order`,
    STATUS: (id: string) => `/visits/${id}/status`,
  },
  STATS: {
    GET: '/stats',
  },
};
