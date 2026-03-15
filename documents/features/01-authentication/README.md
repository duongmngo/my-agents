# Authentication Feature

## Overview

JWT-based authentication system with configurable token lifetimes and WebSocket support.

## ✅ Implemented Features

### User Registration & Login
- Email/password registration
- JWT token generation (access + refresh tokens)
- Configurable token validity:
  - Access token: 24 hours (configurable)
  - Refresh token: 30 days (configurable)

### Token Management
- JWT access tokens for API authentication
- Refresh token rotation
- Token validation middleware
- Configuration via environment variables

### WebSocket Authentication
- JWT token passed via query parameter on connect
- Token validation during handshake
- Automatic redirect to login on invalid/expired token (close code 1008)
- Auth data cleared and return URL preserved for post-login redirect

### Session Handling
- Stateless JWT authentication
- Token refresh before expiration
- Automatic logout on auth errors

## Configuration

```env
# Token validity configuration
ACCESS_TOKEN_EXPIRE_MINUTES=1440  # 24 hours
REFRESH_TOKEN_EXPIRE_DAYS=30
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
```

## Pending Features

### 01-03-oauth-integration
- Google OAuth
- GitHub OAuth
- Microsoft OAuth

### 01-04-password-management
- Password reset flow
- Password change

### 01-05-multi-factor-auth
- 2FA setup
- TOTP implementation

### 01-06-session-management
- Active sessions tracking
- Session termination

### 01-07-role-based-access
- User roles (user, admin, owner)
- Permission management

## Key Files

### Backend
- `app/core/auth.py` - Token generation/validation
- `app/api/v1/auth.py` - Auth endpoints
- `app/core/config.py` - Token configuration

### Frontend
- `services/auth-service/` - Auth API client
- `providers/auth-provider.tsx` - Auth context
- `services/websocket-service/` - WebSocket auth handling 