export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    PROFILE: '/auth/profile',
  },
  
  // Tenants
  TENANTS: {
    LIST: '/tenants',
    DETAIL: '/tenants/:id',
    CREATE: '/tenants',
    UPDATE: '/tenants/:id',
    DELETE: '/tenants/:id',
  },
  
  // Agents
  AGENTS: {
    LIST: '/agents',
    DETAIL: '/agents/:id',
    CREATE: '/agents',
    UPDATE: '/agents/:id',
    DELETE: '/agents/:id',
    CLONE: '/agents/:id/clone',
    SHARE: '/agents/:id/share',
  },
  
  // Conversations
  CONVERSATIONS: {
    LIST: '/conversations',
    DETAIL: '/conversations/:id',
    CREATE: '/conversations',
    DELETE: '/conversations/:id',
    MESSAGES: '/conversations/:id/messages',
  },
  
  // Messages
  MESSAGES: {
    CREATE: '/conversations/:conversationId/messages',
    UPDATE: '/messages/:id',
    DELETE: '/messages/:id',
  },
  
  // Files
  FILES: {
    UPLOAD: '/files/upload',
    LIST: '/files',
    DETAIL: '/files/:id',
    DELETE: '/files/:id',
    DOWNLOAD: '/files/:id/download',
  },
  
  // Analytics
  ANALYTICS: {
    USAGE: '/analytics/usage',
    PERFORMANCE: '/analytics/performance',
    COSTS: '/analytics/costs',
  },
} as const;

export const HTTP_METHODS = {
  GET: 'GET',
  POST: 'POST',
  PUT: 'PUT',
  PATCH: 'PATCH',
  DELETE: 'DELETE',
} as const;

export const API_STATUS_CODES = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
} as const;

export const API_HEADERS = {
  CONTENT_TYPE: 'Content-Type',
  AUTHORIZATION: 'Authorization',
  TENANT_ID: 'X-Tenant-ID',
  USER_ID: 'X-User-ID',
} as const; 