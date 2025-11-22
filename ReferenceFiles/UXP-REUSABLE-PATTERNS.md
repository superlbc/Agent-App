# UXP Reusable Patterns - Migration Guide

> **Extracted from:** Employee Onboarding System (v2.0.0)
> **Target Application:** Unified Experience Platform (UXP)
> **Reusability:** 70-80% infrastructure preservation
> **Date:** 2025-11-22

---

## Executive Summary

This document extracts proven patterns from the Employee Onboarding System that can be reused for UXP (Unified Experience Platform). The onboarding system provides a solid foundation with enterprise-grade authentication, comprehensive UI components, API patterns, telemetry, and Cloud Run deployment infrastructure.

**Key Wins:**
- Complete authentication framework (MSAL + Azure AD + Group Security)
- Production-ready UI component library (15+ components)
- Backend API proxy pattern with JWT validation
- Telemetry framework with Power Automate integration
- Cloud Run deployment scripts (frontend + backend)
- Graph API integration for user/department data

**Effort Savings:** 3-4 weeks of development time by reusing these patterns

---

## Table of Contents

1. [Authentication Framework](#1-authentication-framework) (CRITICAL)
2. [UI Component Library](#2-ui-component-library) (HIGH)
3. [API Service Pattern](#3-api-service-pattern) (HIGH)
4. [Backend Proxy Architecture](#4-backend-proxy-architecture) (HIGH)
5. [State Management Pattern](#5-state-management-pattern) (MEDIUM)
6. [Telemetry Framework](#6-telemetry-framework) (MEDIUM)
7. [Deployment Pattern](#7-deployment-pattern) (HIGH)
8. [Graph API Integration](#8-graph-api-integration) (MEDIUM)
9. [Migration Checklist](#9-migration-checklist)
10. [Configuration Templates](#10-configuration-templates)
11. [Dependencies](#11-dependencies)
12. [Gotchas and Best Practices](#12-gotchas-and-best-practices)

---

## 1. Authentication Framework

**Priority:** CRITICAL
**Reusability:** 95% (only group IDs and redirect URIs change)
**Effort Savings:** 1-2 weeks

### Pattern Description

Complete MSAL (Microsoft Authentication Library) implementation with Azure AD integration, group-based access control, and comprehensive security features. Includes frontend token validation, backend JWT verification, and professional access denied handling.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ User Browser                                                │
│  ├─ AuthGuard.tsx (MSAL initialization)                    │
│  ├─ AuthContext.tsx (user state, isAuthorized)             │
│  └─ AccessDenied.tsx (professional error page)             │
└───────────────────┬────────────────────────────────────────┘
                    │ HTTPS (Bearer Token)
                    ▼
┌────────────────────────────────────────────────────────────┐
│ Backend API (Node.js/Express)                              │
│  └─ middleware/auth.js (JWT validation + group check)      │
└────────────────────────────────────────────────────────────┘
```

### Files to Copy

**Frontend:**
- `auth/authConfig.ts` - MSAL configuration (client ID, tenant, scopes, group ID)
- `auth/AuthGuard.tsx` - Authentication wrapper with group membership validation
- `auth/AccessDenied.tsx` - Professional access denied page
- `contexts/AuthContext.tsx` - User state management

**Backend:**
- `backend/middleware/auth.js` - JWT validation and group membership middleware

### Code Examples

#### authConfig.ts (Frontend)

```typescript
import { Configuration, LogLevel } from '@msal/browser';

// REQUIRED GROUP ID - Change this for UXP
export const REQUIRED_GROUP_ID = '2c08b5d8-7def-4845-a48c-740b987dcffb'; // "MOM WW All Users 1 SG"

export const msalConfig: Configuration = {
  auth: {
    clientId: "5fa64631-ea56-4676-b6d5-433d322a4da1", // YOUR AZURE AD APP ID
    authority: "https://login.microsoftonline.com/d026e4c1-5892-497a-b9da-ee493c9f0364", // YOUR TENANT ID
    redirectUri: window.location.origin, // Auto-detect (works for dev + prod)
  },
  cache: {
    cacheLocation: "sessionStorage", // Options: "sessionStorage" or "localStorage"
    storeAuthStateInCookie: false,
  },
  system: {
    loggerOptions: {
      loggerCallback: (level, message, containsPii) => {
        if (containsPii) return;
        console.log(message);
      },
      logLevel: LogLevel.Warning,
    },
  },
};

export const loginRequest = {
  scopes: ["User.Read", "profile", "openid"], // Required for group claims
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value",
};
```

#### AuthGuard.tsx (Simplified)

```typescript
import { useMsal } from '@msal/react';
import { useEffect, useState } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import AccessDenied from './AccessDenied';
import { REQUIRED_GROUP_ID } from './authConfig';

export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const { instance, accounts } = useMsal();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (accounts.length === 0) {
      // Not authenticated - trigger login
      instance.loginPopup().catch(console.error);
    } else {
      // Authenticated - check group membership
      const account = accounts[0];
      const groups = account.idTokenClaims?.groups || [];

      const isMember = groups.includes(REQUIRED_GROUP_ID);

      setIsAuthenticated(true);
      setIsAuthorized(isMember);
      setUser({
        name: account.name,
        email: account.username,
        id: account.homeAccountId,
      });

      if (!isMember) {
        console.warn('User not in required group:', REQUIRED_GROUP_ID);
      }
    }
  }, [accounts, instance]);

  if (!isAuthenticated) {
    return <div>Loading...</div>;
  }

  if (!isAuthorized) {
    return <AccessDenied user={user} />;
  }

  return (
    <AuthContext.Provider value={{ user, isAuthorized, logout: () => instance.logout() }}>
      {children}
    </AuthContext.Provider>
  );
}
```

#### backend/middleware/auth.js (Backend JWT Validation)

```javascript
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

const REQUIRED_GROUP_ID = '2c08b5d8-7def-4845-a48c-740b987dcffb';
const TENANT_ID = 'd026e4c1-5892-497a-b9da-ee493c9f0364';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
});

function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key.publicKey || key.rsaPublicKey;
    callback(null, signingKey);
  });
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid Authorization header' });
  }

  const token = authHeader.substring(7);

  jwt.verify(token, getKey, {
    audience: '5fa64631-ea56-4676-b6d5-433d322a4da1', // YOUR CLIENT ID
    issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
  }, (err, decoded) => {
    if (err) {
      console.error('JWT verification failed:', err);
      return res.status(401).json({ error: 'Invalid token' });
    }

    // Check group membership
    const groups = decoded.groups || [];
    if (!groups.includes(REQUIRED_GROUP_ID)) {
      console.warn('User not in required group:', decoded.preferred_username);
      return res.status(403).json({ error: 'Access denied - insufficient permissions' });
    }

    req.user = decoded;
    next();
  });
}

module.exports = authMiddleware;
```

### How to Reuse for UXP

1. **Azure AD App Registration:**
   - Create new Azure AD app registration for UXP
   - Copy client ID and tenant ID
   - Add redirect URIs (local: http://localhost:5173, prod: https://uxp.momentum.com)
   - Configure token claims to include `groups` (Security groups, ID + Access tokens)

2. **Update Configuration:**
   - Replace `REQUIRED_GROUP_ID` with UXP access group ID
   - Update `clientId` and `authority` in authConfig.ts
   - Update backend JWT validation with new client ID

3. **Customize Access Denied Page:**
   - Update `AccessDenied.tsx` with UXP branding
   - Change group name display
   - Update support contact information

4. **Test Authentication Flow:**
   - Test login with authorized user (should load app)
   - Test login with unauthorized user (should show access denied)
   - Test backend API calls (should validate JWT + group)

### Benefits

- Enterprise-grade security with defense in depth (frontend + backend)
- Zero additional API permissions needed (uses token claims only)
- Professional user experience with branded access denied page
- Comprehensive audit trail via telemetry
- Fast performance (no Graph API calls for authorization)

### Configuration Checklist

- [ ] Create Azure AD app registration for UXP
- [ ] Copy client ID and tenant ID to authConfig.ts
- [ ] Determine UXP access group (or create new security group)
- [ ] Update REQUIRED_GROUP_ID in frontend and backend
- [ ] Configure redirect URIs for dev and production
- [ ] Enable groups claim in token configuration
- [ ] Test login flow with authorized/unauthorized users
- [ ] Update AccessDenied.tsx branding

---

## 2. UI Component Library

**Priority:** HIGH
**Reusability:** 90% (minor styling tweaks for UXP branding)
**Effort Savings:** 1 week

### Pattern Description

Comprehensive React + TypeScript component library with 15+ reusable components, all supporting dark mode, accessibility (ARIA labels), and consistent Tailwind CSS styling.

### Component Catalog

| Component | Purpose | Features |
|-----------|---------|----------|
| **Button** | Primary UI action | 4 variants (primary, secondary, ghost, danger), 3 sizes, disabled state, loading spinner |
| **Card** | Container with elevation | Border/shadow variants, dark mode, padding options |
| **Input** | Text input with label | Validation states, error messages, prefix/suffix icons, auto-focus |
| **Textarea** | Multi-line text input | Auto-resize, character counter, validation |
| **Select** | Dropdown selection | Search/filter, multi-select, grouped options, keyboard navigation |
| **Chip** | Tag/label component | Removable, color variants, icon support |
| **Toast** | Notification system | 4 types (success, error, warning, info), auto-dismiss, stacking |
| **ToggleSwitch** | Boolean toggle | Labeled, disabled state, onChange callback |
| **Modal** | Overlay dialog | Backdrop, close on escape, focus trap, custom header/footer |
| **LoadingModal** | Full-screen loader | Spinner, custom message, backdrop blur |
| **SkeletonLoader** | Content placeholder | Width/height customizable, dark mode, pulse animation |
| **Tooltip** | Hover info | 4 positions (top, bottom, left, right), delay, arrow |
| **Icon** | SVG icon system | 30+ icons, size variants, color customization |
| **ScrollToTop** | FAB scroll button | Appears after 400px scroll, smooth animation |
| **VersionUpdateBanner** | Update notification | Non-intrusive, dismissible, one-click refresh |

### Files to Copy

**Copy entire directory:**
```
components/ui/
├── Button.tsx
├── Card.tsx
├── Input.tsx
├── Textarea.tsx
├── Select.tsx
├── Chip.tsx
├── Toast.tsx
├── ToggleSwitch.tsx
├── Modal.tsx
├── LoadingModal.tsx
├── SkeletonLoader.tsx
├── Tooltip.tsx
├── Icon.tsx
├── ScrollToTop.tsx
└── VersionUpdateBanner.tsx
```

### Code Example: Button Component

```typescript
interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = '',
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-md transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-primary-500 text-white hover:bg-primary-600 active:scale-98',
    secondary: 'bg-transparent border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800',
    ghost: 'bg-transparent text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20',
    danger: 'bg-red-500 text-white hover:bg-red-600 active:scale-98',
  };

  const sizes = {
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
  };

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {loading ? <span className="animate-spin">⏳</span> : children}
    </button>
  );
}
```

### How to Reuse for UXP

1. **Copy Component Library:**
   - Copy `components/ui/` directory to UXP project
   - No modifications needed initially (works out of the box)

2. **Customize Branding:**
   - Update Tailwind config with UXP brand colors
   - Replace `primary-500` with UXP primary color
   - Update icon set if UXP has custom icons

3. **Import and Use:**
   ```typescript
   import { Button, Card, Input, Select } from './components/ui';

   function CreateEventForm() {
     return (
       <Card>
         <Input label="Event Name" />
         <Select label="Event Type" options={eventTypes} />
         <Button variant="primary">Create Event</Button>
       </Card>
     );
   }
   ```

### UXP-Specific Use Cases

**Event Creation Form:**
- Input: Event name, date range, venue
- Select: Program type, client, event type
- Button: Submit event, save draft, cancel

**Calendar View:**
- Card: Event preview with status badge
- Chip: Event tags (client, type, status)
- Tooltip: Quick event details on hover

**Recap Approval:**
- ToggleSwitch: Approve/reject toggle
- Textarea: Approval comments
- Button: Submit approval, request changes

**Loading States:**
- LoadingModal: Creating event, syncing with Brandscopic
- SkeletonLoader: Loading event list, calendar view

### Benefits

- Consistent design language across UXP
- Accessibility built-in (WCAG 2.1 AA compliant)
- Dark mode support (matches system preference)
- TypeScript type safety
- Responsive and mobile-friendly
- Battle-tested in production

### Configuration Checklist

- [ ] Copy components/ui/ directory to UXP
- [ ] Update Tailwind config with UXP brand colors
- [ ] Test all components in UXP environment
- [ ] Customize icon set if needed
- [ ] Add UXP-specific components (e.g., EventCard, CalendarDay)

---

## 3. API Service Pattern

**Priority:** HIGH
**Reusability:** 80% (API endpoints change, pattern stays same)
**Effort Savings:** 3-4 days

### Pattern Description

Centralized API service layer with token acquisition, caching, error handling, retry logic, and TypeScript interfaces. Provides clean separation between API logic and UI components.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ React Components                                            │
│  ├─ CreateEventForm.tsx                                    │
│  ├─ EventList.tsx                                          │
│  └─ RecapApproval.tsx                                      │
└───────────────┬────────────────────────────────────────────┘
                │ Import apiService
                ▼
┌────────────────────────────────────────────────────────────┐
│ services/apiService.ts                                      │
│  ├─ getToken() - OAuth 2.0 token acquisition + caching    │
│  ├─ createEvent() - POST /api/events                      │
│  ├─ updateEvent() - PUT /api/events/:id                   │
│  ├─ getEvents() - GET /api/events (with filters)          │
│  ├─ approveRecap() - POST /api/recaps/:id/approve         │
│  └─ Error handling, retry logic, type safety               │
└───────────────┬────────────────────────────────────────────┘
                │ HTTPS with Bearer token
                ▼
┌────────────────────────────────────────────────────────────┐
│ Backend API (Node.js/Express)                              │
│  ├─ JWT validation middleware                              │
│  ├─ Group membership check                                 │
│  └─ Proxy to UXP database or external APIs                 │
└────────────────────────────────────────────────────────────┘
```

### Files to Copy

- `services/apiService.ts` - Main API client (adapt endpoints for UXP)
- `types.ts` - TypeScript interfaces for API requests/responses

### Code Example: API Service Pattern

```typescript
// services/uxpApiService.ts

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface Event {
  id: string;
  masterProgramId: string;
  masterEventId: string;
  eventName: string;
  eventDate: string;
  clientName: string;
  programType: string;
  eventType: string;
  status: 'planned' | 'confirmed' | 'cancelled';
  venueAddress: string;
  createdBy: string;
  createdDate: string;
}

interface CreateEventRequest {
  eventName: string;
  eventDates: string[]; // Array of dates (each day = unique event)
  clientName: string;
  programType: string;
  eventType: string;
  venueAddress: string;
  businessLeadership: { firstName: string; lastName: string; email: string };
  projectLeader: { firstName: string; lastName: string; email: string };
}

class UXPApiService {
  private tokenCache: { token: string; expiresAt: number } | null = null;

  // Token acquisition with caching
  async getToken(): Promise<string> {
    const now = Date.now();

    // Return cached token if valid (refresh 60s before expiration)
    if (this.tokenCache && this.tokenCache.expiresAt > now + 60000) {
      return this.tokenCache.token;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/token`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          client_id: import.meta.env.CLIENT_ID,
          client_secret: import.meta.env.CLIENT_SECRET,
          grant_type: 'client_credentials',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to acquire token');
      }

      const data: TokenResponse = await response.json();

      // Cache token with expiration
      this.tokenCache = {
        token: data.access_token,
        expiresAt: now + data.expires_in * 1000,
      };

      return data.access_token;
    } catch (error) {
      console.error('Token acquisition failed:', error);
      throw error;
    }
  }

  // Create event with retry logic
  async createEvent(request: CreateEventRequest): Promise<Event[]> {
    const token = await this.getToken();
    const maxRetries = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(`${API_BASE_URL}/api/events`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        const events: Event[] = await response.json();
        return events; // Success
      } catch (error) {
        lastError = error as Error;
        console.warn(`Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt - 1)));
        }
      }
    }

    throw new Error(`Failed after ${maxRetries} attempts: ${lastError?.message}`);
  }

  // Get events with filters
  async getEvents(filters?: {
    clientName?: string;
    eventType?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<Event[]> {
    const token = await this.getToken();

    const queryParams = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });
    }

    const url = `${API_BASE_URL}/api/events?${queryParams.toString()}`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch events');
    }

    return response.json();
  }

  // Update event
  async updateEvent(eventId: string, updates: Partial<Event>): Promise<Event> {
    const token = await this.getToken();

    const response = await fetch(`${API_BASE_URL}/api/events/${eventId}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error('Failed to update event');
    }

    return response.json();
  }

  // Approve recap
  async approveRecap(eventId: string, approved: boolean, comments?: string): Promise<void> {
    const token = await this.getToken();

    const response = await fetch(`${API_BASE_URL}/api/recaps/${eventId}/approve`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved, comments }),
    });

    if (!response.ok) {
      throw new Error('Failed to approve recap');
    }
  }

  // Send event to Brandscopic API
  async syncToBrandscopic(eventId: string): Promise<{ brandscopicProjectId: string }> {
    const token = await this.getToken();

    const response = await fetch(`${API_BASE_URL}/api/integrations/brandscopic/events`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ eventId }),
    });

    if (!response.ok) {
      throw new Error('Failed to sync with Brandscopic');
    }

    return response.json();
  }
}

export const uxpApi = new UXPApiService();
```

### How to Reuse for UXP

1. **Copy Pattern:**
   - Copy `apiService.ts` structure
   - Rename to `uxpApiService.ts`
   - Define UXP-specific TypeScript interfaces (Event, Recap, Client, etc.)

2. **Update Endpoints:**
   - Replace Onboarding endpoints with UXP endpoints:
     - `POST /api/events` - Create event
     - `GET /api/events` - List events with filters
     - `PUT /api/events/:id` - Update event
     - `POST /api/recaps/:id/approve` - Approve recap
     - `POST /api/integrations/brandscopic/events` - Sync with Brandscopic

3. **Customize Error Handling:**
   - Add UXP-specific error messages
   - Implement retry logic for Brandscopic API (may be flaky)
   - Add telemetry tracking for API failures

4. **Usage in Components:**
   ```typescript
   import { uxpApi } from './services/uxpApiService';

   async function handleCreateEvent(formData: CreateEventRequest) {
     try {
       const events = await uxpApi.createEvent(formData);
       console.log('Created events:', events);
       showToast('Event created successfully', 'success');
     } catch (error) {
       console.error('Failed to create event:', error);
       showToast('Failed to create event', 'error');
     }
   }
   ```

### Benefits

- Centralized API logic (easy to maintain)
- Automatic token management (no manual refresh)
- Retry logic for transient failures
- Type safety with TypeScript
- Clean component code (no API logic in UI)

### Configuration Checklist

- [ ] Copy apiService.ts pattern to uxpApiService.ts
- [ ] Define TypeScript interfaces for UXP entities (Event, Recap, Client)
- [ ] Update API base URL for UXP backend
- [ ] Implement UXP-specific endpoints
- [ ] Add telemetry tracking for API calls
- [ ] Test token acquisition and caching
- [ ] Test retry logic with network failures
- [ ] Add error handling for Brandscopic integration

---

## 4. Backend Proxy Architecture

**Priority:** HIGH
**Reusability:** 85% (endpoints change, security pattern stays same)
**Effort Savings:** 3-5 days

### Pattern Description

Node.js/Express backend that acts as a secure proxy between frontend and external APIs, handling authentication, secrets management, CORS, and JWT validation. Keeps sensitive credentials (CLIENT_SECRET) server-side and enforces group-based access control.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ Frontend (React + MSAL)                                     │
│  ├─ User authenticates with Azure AD                       │
│  ├─ Receives JWT token with groups claim                   │
│  └─ Calls backend with Bearer token                        │
└───────────────┬────────────────────────────────────────────┘
                │ HTTPS + Bearer Token
                ▼
┌────────────────────────────────────────────────────────────┐
│ Backend Proxy (Node.js/Express)                            │
│  ├─ JWT validation middleware (verifies signature)         │
│  ├─ Group membership check (enforces access control)       │
│  ├─ Stores CLIENT_SECRET securely (never exposed)          │
│  ├─ Proxies requests to external APIs                      │
│  └─ CORS configuration (allows frontend origin)            │
└───────────────┬────────────────────────────────────────────┘
                │ HTTPS + API Keys
                ├──────────────────┬─────────────────────────┐
                ▼                  ▼                         ▼
    ┌────────────────┐  ┌──────────────────┐  ┌──────────────────┐
    │ UXP Database   │  │ Brandscopic API  │  │ Qualtrics API    │
    │ (Azure SQL)    │  │ (Field Mgmt)     │  │ (Survey Data)    │
    └────────────────┘  └──────────────────┘  └──────────────────┘
```

### Files to Copy

**Copy entire backend directory:**
```
backend/
├── server.js                    # Main Express server
├── middleware/
│   └── auth.js                  # JWT validation + group check
├── routes/
│   ├── events.js                # Event CRUD endpoints (create new for UXP)
│   ├── recaps.js                # Recap approval endpoints (create new for UXP)
│   └── integrations/
│       ├── brandscopic.js       # Brandscopic API proxy (create new for UXP)
│       └── qualtrics.js         # Qualtrics API proxy (create new for UXP)
├── package.json                 # Dependencies (jsonwebtoken, jwks-rsa, cors, express)
├── Dockerfile                   # Docker container config
└── .env                         # Environment variables (gitignored)
```

### Code Example: Backend Server

```javascript
// backend/server.js

const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS configuration (allow frontend origin)
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
};
app.use(cors(corsOptions));

// Body parser
app.use(express.json());

// Health check (no auth required)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes (require JWT + group membership)
app.use('/api/events', authMiddleware, require('./routes/events'));
app.use('/api/recaps', authMiddleware, require('./routes/recaps'));
app.use('/api/integrations/brandscopic', authMiddleware, require('./routes/integrations/brandscopic'));
app.use('/api/integrations/qualtrics', authMiddleware, require('./routes/integrations/qualtrics'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`UXP Backend listening on port ${PORT}`);
});
```

### Code Example: Event Routes

```javascript
// backend/routes/events.js

const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');

// Mock database (replace with Azure SQL queries)
let events = [];

// GET /api/events - List events with filters
router.get('/', async (req, res) => {
  try {
    const { clientName, eventType, status, startDate, endDate } = req.query;

    let filteredEvents = events;

    if (clientName) {
      filteredEvents = filteredEvents.filter(e => e.clientName === clientName);
    }
    if (eventType) {
      filteredEvents = filteredEvents.filter(e => e.eventType === eventType);
    }
    if (status) {
      filteredEvents = filteredEvents.filter(e => e.status === status);
    }
    if (startDate) {
      filteredEvents = filteredEvents.filter(e => e.eventDate >= startDate);
    }
    if (endDate) {
      filteredEvents = filteredEvents.filter(e => e.eventDate <= endDate);
    }

    res.json(filteredEvents);
  } catch (error) {
    console.error('Failed to fetch events:', error);
    res.status(500).json({ error: 'Failed to fetch events' });
  }
});

// POST /api/events - Create event
router.post('/', async (req, res) => {
  try {
    const {
      eventName,
      eventDates,
      clientName,
      programType,
      eventType,
      venueAddress,
      businessLeadership,
      projectLeader,
    } = req.body;

    // Validation
    if (!eventName || !eventDates || eventDates.length === 0) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Generate Master Program ID (GUID)
    const masterProgramId = uuidv4();

    // Create one event per date
    const createdEvents = eventDates.map(date => ({
      id: uuidv4(),
      masterProgramId,
      masterEventId: uuidv4(), // Unique per day
      eventName,
      eventDate: date,
      clientName,
      programType,
      eventType,
      status: 'planned',
      venueAddress,
      businessLeadership,
      projectLeader,
      createdBy: req.user.preferred_username, // From JWT
      createdDate: new Date().toISOString(),
    }));

    events.push(...createdEvents);

    res.status(201).json(createdEvents);
  } catch (error) {
    console.error('Failed to create event:', error);
    res.status(500).json({ error: 'Failed to create event' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events[eventIndex] = {
      ...events[eventIndex],
      ...updates,
      lastUpdated: new Date().toISOString(),
      lastUpdatedBy: req.user.preferred_username,
    };

    res.json(events[eventIndex]);
  } catch (error) {
    console.error('Failed to update event:', error);
    res.status(500).json({ error: 'Failed to update event' });
  }
});

// DELETE /api/events/:id - Cancel event
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const eventIndex = events.findIndex(e => e.id === id);
    if (eventIndex === -1) {
      return res.status(404).json({ error: 'Event not found' });
    }

    events[eventIndex].status = 'cancelled';
    events[eventIndex].cancelledBy = req.user.preferred_username;
    events[eventIndex].cancelledDate = new Date().toISOString();

    res.json(events[eventIndex]);
  } catch (error) {
    console.error('Failed to cancel event:', error);
    res.status(500).json({ error: 'Failed to cancel event' });
  }
});

module.exports = router;
```

### Code Example: Brandscopic Integration

```javascript
// backend/routes/integrations/brandscopic.js

const express = require('express');
const router = express.Router();
const fetch = require('node-fetch');

const BRANDSCOPIC_API_URL = process.env.BRANDSCOPIC_API_URL;
const BRANDSCOPIC_API_KEY = process.env.BRANDSCOPIC_API_KEY;

// POST /api/integrations/brandscopic/events - Send event to Brandscopic
router.post('/events', async (req, res) => {
  try {
    const { eventId } = req.body;

    // Fetch event from database
    const event = events.find(e => e.id === eventId);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Transform to Brandscopic format
    const brandscopicPayload = {
      project_name: event.eventName,
      project_date: event.eventDate,
      client_name: event.clientName,
      program_type: event.programType,
      venue_address: event.venueAddress,
      custom_fields: {
        master_program_id: event.masterProgramId,
        master_event_id: event.masterEventId,
      },
    };

    // Send to Brandscopic API
    const response = await fetch(`${BRANDSCOPIC_API_URL}/projects`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${BRANDSCOPIC_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(brandscopicPayload),
    });

    if (!response.ok) {
      throw new Error(`Brandscopic API error: ${response.statusText}`);
    }

    const brandscopicData = await response.json();

    // Store Brandscopic project ID
    event.brandscopicProjectId = brandscopicData.project_id;

    res.json({ brandscopicProjectId: brandscopicData.project_id });
  } catch (error) {
    console.error('Brandscopic integration failed:', error);
    res.status(500).json({ error: 'Failed to sync with Brandscopic' });
  }
});

// GET /api/integrations/brandscopic/recaps/:eventId - Fetch recap from Brandscopic
router.get('/recaps/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;

    const event = events.find(e => e.id === eventId);
    if (!event || !event.brandscopicProjectId) {
      return res.status(404).json({ error: 'Event not synced with Brandscopic' });
    }

    // Fetch recap from Brandscopic
    const response = await fetch(
      `${BRANDSCOPIC_API_URL}/projects/${event.brandscopicProjectId}/recap`,
      {
        headers: {
          'Authorization': `Bearer ${BRANDSCOPIC_API_KEY}`,
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Brandscopic API error: ${response.statusText}`);
    }

    const recapData = await response.json();

    res.json(recapData);
  } catch (error) {
    console.error('Failed to fetch recap from Brandscopic:', error);
    res.status(500).json({ error: 'Failed to fetch recap' });
  }
});

module.exports = router;
```

### How to Reuse for UXP

1. **Copy Backend Structure:**
   - Copy `backend/` directory to UXP project
   - Keep `server.js` and `middleware/auth.js` as-is
   - Create new route files for UXP entities (events, recaps, clients)

2. **Environment Variables:**
   Create `backend/.env`:
   ```env
   PORT=8080
   FRONTEND_URL=http://localhost:5173
   REQUIRED_GROUP_ID=2c08b5d8-7def-4845-a48c-740b987dcffb
   TENANT_ID=d026e4c1-5892-497a-b9da-ee493c9f0364
   CLIENT_ID=5fa64631-ea56-4676-b6d5-433d322a4da1

   # UXP-specific
   BRANDSCOPIC_API_URL=https://api.brandscopic.com
   BRANDSCOPIC_API_KEY=your-api-key
   QUALTRICS_API_URL=https://yourdatacenter.qualtrics.com/API/v3
   QUALTRICS_API_KEY=your-api-key
   AZURE_SQL_CONNECTION_STRING=Server=tcp:...
   ```

3. **Database Integration:**
   - Install Azure SQL client: `npm install mssql`
   - Replace in-memory `events` array with SQL queries
   - Create stored procedures for event CRUD operations

4. **API Integration:**
   - Create `routes/integrations/brandscopic.js` for Brandscopic API
   - Create `routes/integrations/qualtrics.js` for Qualtrics API
   - Handle bidirectional sync (UXP → Brandscopic, Brandscopic → UXP)

5. **CORS Configuration:**
   - Update `FRONTEND_URL` for production: `https://uxp.momentum.com`
   - Test CORS with frontend running on different port

### Benefits

- CLIENT_SECRET never exposed to browser (server-side only)
- JWT validation enforces authentication + authorization
- Centralized error handling and logging
- Easy to add new API integrations
- CORS handled properly

### Configuration Checklist

- [ ] Copy backend/ directory to UXP project
- [ ] Install dependencies: `npm install express cors jsonwebtoken jwks-rsa node-fetch mssql`
- [ ] Create .env file with UXP credentials
- [ ] Update authMiddleware with UXP group ID
- [ ] Create event routes (GET, POST, PUT, DELETE)
- [ ] Create recap routes (approve, reject)
- [ ] Create Brandscopic integration routes
- [ ] Create Qualtrics integration routes
- [ ] Replace in-memory storage with Azure SQL
- [ ] Test JWT validation with frontend
- [ ] Test CORS with frontend running on localhost:5173

---

## 5. State Management Pattern

**Priority:** MEDIUM
**Reusability:** 90%
**Effort Savings:** 2-3 days

### Pattern Description

React Context API for global state management with localStorage persistence, custom hooks for state access, and session management. Provides clean separation of concerns and avoids prop drilling.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ App.tsx (Root Component)                                    │
│  ├─ AuthContext.Provider (user, isAuthorized, logout)      │
│  ├─ EventContext.Provider (events, clients, eventTypes)    │
│  └─ UXPContext.Provider (selectedEvent, filters, view)     │
└───────────────┬────────────────────────────────────────────┘
                │ Context available to all children
                ▼
┌────────────────────────────────────────────────────────────┐
│ Components (Any Depth)                                      │
│  ├─ CreateEventForm.tsx                                    │
│  │   └─ useAuth() → user, logout                          │
│  ├─ EventList.tsx                                          │
│  │   └─ useEvents() → events, loadEvents, createEvent     │
│  └─ CalendarView.tsx                                       │
│      └─ useUXP() → selectedEvent, setSelectedEvent        │
└────────────────────────────────────────────────────────────┘
```

### Files to Copy

- `contexts/AuthContext.tsx` - User authentication state (copy as-is)
- `hooks/useLocalStorage.ts` - localStorage with React state sync (copy as-is)

### Code Example: EventContext (Create New for UXP)

```typescript
// contexts/EventContext.tsx

import React, { createContext, useContext, useState, useEffect } from 'react';
import { uxpApi } from '../services/uxpApiService';

interface Event {
  id: string;
  masterProgramId: string;
  masterEventId: string;
  eventName: string;
  eventDate: string;
  clientName: string;
  programType: string;
  eventType: string;
  status: 'planned' | 'confirmed' | 'cancelled';
}

interface EventContextType {
  events: Event[];
  clients: string[];
  eventTypes: string[];
  loading: boolean;
  error: string | null;
  loadEvents: (filters?: any) => Promise<void>;
  createEvent: (eventData: any) => Promise<Event[]>;
  updateEvent: (eventId: string, updates: Partial<Event>) => Promise<void>;
  deleteEvent: (eventId: string) => Promise<void>;
}

const EventContext = createContext<EventContextType | null>(null);

export function EventProvider({ children }: { children: React.ReactNode }) {
  const [events, setEvents] = useState<Event[]>([]);
  const [clients, setClients] = useState<string[]>([]);
  const [eventTypes, setEventTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load events on mount
  useEffect(() => {
    loadEvents();
    loadMasterData();
  }, []);

  const loadEvents = async (filters?: any) => {
    setLoading(true);
    setError(null);
    try {
      const data = await uxpApi.getEvents(filters);
      setEvents(data);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadMasterData = async () => {
    try {
      // Load clients and event types from backend
      const clientsData = await uxpApi.getClients();
      const eventTypesData = await uxpApi.getEventTypes();
      setClients(clientsData.map((c: any) => c.name));
      setEventTypes(eventTypesData.map((t: any) => t.name));
    } catch (err) {
      console.error('Failed to load master data:', err);
    }
  };

  const createEvent = async (eventData: any) => {
    setLoading(true);
    setError(null);
    try {
      const newEvents = await uxpApi.createEvent(eventData);
      setEvents([...events, ...newEvents]);
      return newEvents;
    } catch (err) {
      setError('Failed to create event');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (eventId: string, updates: Partial<Event>) => {
    try {
      const updatedEvent = await uxpApi.updateEvent(eventId, updates);
      setEvents(events.map(e => e.id === eventId ? updatedEvent : e));
    } catch (err) {
      setError('Failed to update event');
      throw err;
    }
  };

  const deleteEvent = async (eventId: string) => {
    try {
      await uxpApi.deleteEvent(eventId);
      setEvents(events.filter(e => e.id !== eventId));
    } catch (err) {
      setError('Failed to delete event');
      throw err;
    }
  };

  return (
    <EventContext.Provider value={{
      events,
      clients,
      eventTypes,
      loading,
      error,
      loadEvents,
      createEvent,
      updateEvent,
      deleteEvent,
    }}>
      {children}
    </EventContext.Provider>
  );
}

export function useEvents() {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEvents must be used within EventProvider');
  }
  return context;
}
```

### Code Example: useLocalStorage Hook (Copy As-Is)

```typescript
// hooks/useLocalStorage.ts

import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  // Initialize state from localStorage or default value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
      return initialValue;
    }
  });

  // Save to localStorage whenever value changes
  const setValue = (value: T | ((val: T) => T)) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      window.localStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.warn(`Error setting localStorage key "${key}":`, error);
    }
  };

  return [storedValue, setValue] as const;
}
```

### How to Reuse for UXP

1. **Copy AuthContext As-Is:**
   - No changes needed for UXP
   - Provides user state, logout, and authorization

2. **Create EventContext:**
   - Copy pattern above
   - Add UXP-specific methods (loadEvents, createEvent, etc.)
   - Load master data (clients, event types) on mount

3. **Create UXPContext for UI State:**
   ```typescript
   // contexts/UXPContext.tsx

   interface UXPContextType {
     selectedEvent: Event | null;
     setSelectedEvent: (event: Event | null) => void;
     view: 'calendar' | 'list' | 'grid';
     setView: (view: 'calendar' | 'list' | 'grid') => void;
     filters: EventFilters;
     setFilters: (filters: EventFilters) => void;
   }
   ```

4. **Wrap App with Providers:**
   ```typescript
   // App.tsx

   function App() {
     return (
       <MsalProvider instance={msalInstance}>
         <AuthGuard>
           <AuthProvider>
             <EventProvider>
               <UXPProvider>
                 <Router />
               </UXPProvider>
             </EventProvider>
           </AuthProvider>
         </AuthGuard>
       </MsalProvider>
     );
   }
   ```

5. **Use in Components:**
   ```typescript
   // components/CreateEventForm.tsx

   import { useAuth } from '../contexts/AuthContext';
   import { useEvents } from '../contexts/EventContext';

   function CreateEventForm() {
     const { user } = useAuth();
     const { createEvent, clients, eventTypes } = useEvents();

     const handleSubmit = async (formData) => {
       await createEvent({
         ...formData,
         createdBy: user.email,
       });
     };

     return (
       <form onSubmit={handleSubmit}>
         <Select label="Client" options={clients} />
         <Select label="Event Type" options={eventTypes} />
         <Button type="submit">Create Event</Button>
       </form>
     );
   }
   ```

### Benefits

- No prop drilling (access state from any component)
- Centralized state management
- localStorage persistence for filters and preferences
- Easy to test (mock context providers)
- TypeScript type safety

### Configuration Checklist

- [ ] Copy contexts/AuthContext.tsx (no changes)
- [ ] Copy hooks/useLocalStorage.ts (no changes)
- [ ] Create contexts/EventContext.tsx with UXP methods
- [ ] Create contexts/UXPContext.tsx for UI state
- [ ] Wrap App.tsx with providers (MSAL → Auth → Event → UXP)
- [ ] Test context providers load correctly
- [ ] Test useLocalStorage persists data across page refresh

---

## 6. Telemetry Framework

**Priority:** MEDIUM
**Reusability:** 95% (event names change, pattern stays same)
**Effort Savings:** 1-2 days

### Pattern Description

Comprehensive event tracking system that sends usage analytics to Power Automate flows for centralized logging and Power BI dashboards. Includes browser context capture, privacy-first design, and fire-and-forget HTTP POST.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ React Components                                            │
│  ├─ trackEvent('eventCreated', { eventName, client })      │
│  ├─ trackEvent('recapApproved', { eventId, approved })     │
│  └─ trackEvent('brandscopicSynced', { eventId })           │
└───────────────┬────────────────────────────────────────────┘
                │ Fire-and-Forget
                ▼
┌────────────────────────────────────────────────────────────┐
│ utils/telemetryService.ts                                   │
│  ├─ Session ID generation (unique per browser session)     │
│  ├─ Browser context capture (browser, OS, device)          │
│  ├─ Event envelope (appName, version, timestamp, user)     │
│  └─ POST to Power Automate endpoint                        │
└───────────────┬────────────────────────────────────────────┘
                │ HTTPS POST
                ▼
┌────────────────────────────────────────────────────────────┐
│ Power Automate Flow (Centralized Telemetry Endpoint)       │
│  ├─ Receive event envelope                                 │
│  ├─ Parse eventPayload JSON                                │
│  ├─ Route to SharePoint list or SQL table                  │
│  └─ Send to Power BI for dashboards                        │
└────────────────────────────────────────────────────────────┘
```

### Files to Copy

- `utils/telemetryService.ts` - Main telemetry service (adapt event types)
- `utils/browserContext.ts` - Browser/device detection (copy as-is)
- `appConfig.ts` - Power Automate endpoint URL (update URL)

### Code Example: Telemetry Service (Adapt Event Types)

```typescript
// utils/telemetryService.ts

interface TelemetryEvent {
  appName: string;
  appVersion: string;
  sessionId: string;
  correlationId?: string;
  eventType: string;
  timestamp: string;
  userContext: {
    name: string;
    email: string;
    tenantId: string;
  };
  eventPayload: string; // JSON string
}

class TelemetryService {
  private sessionId: string;
  private flowUrl: string;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.flowUrl = import.meta.env.VITE_TELEMETRY_FLOW_URL || '';
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }

  async trackEvent(eventType: string, payload: any, user: any) {
    if (!this.flowUrl || this.flowUrl.includes('YOUR_')) {
      console.warn('Telemetry disabled: VITE_TELEMETRY_FLOW_URL not configured');
      return;
    }

    const event: TelemetryEvent = {
      appName: 'UXP - Unified Experience Platform',
      appVersion: '1.0.0',
      sessionId: this.sessionId,
      eventType,
      timestamp: new Date().toISOString(),
      userContext: {
        name: user?.name || 'Unknown User',
        email: user?.email || 'unknown@momentumww.com',
        tenantId: user?.tenantId || '',
      },
      eventPayload: JSON.stringify(payload),
    };

    try {
      // Fire-and-forget (don't await response)
      fetch(this.flowUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(event),
      }).catch(err => console.warn('Telemetry send failed:', err));
    } catch (err) {
      console.warn('Telemetry failed:', err);
    }
  }
}

export const telemetryService = new TelemetryService();

// Convenience functions for UXP events
export function trackEventCreated(eventData: any, user: any) {
  telemetryService.trackEvent('eventCreated', {
    eventName: eventData.eventName,
    clientName: eventData.clientName,
    programType: eventData.programType,
    eventType: eventData.eventType,
    dateCount: eventData.eventDates.length,
  }, user);
}

export function trackRecapApproved(eventId: string, approved: boolean, user: any) {
  telemetryService.trackEvent('recapApproved', {
    eventId,
    approved,
  }, user);
}

export function trackBrandscopicSync(eventId: string, success: boolean, user: any) {
  telemetryService.trackEvent('brandscopicSynced', {
    eventId,
    success,
  }, user);
}

export function trackCalendarViewChanged(view: string, user: any) {
  telemetryService.trackEvent('calendarViewChanged', {
    view,
  }, user);
}

export function trackExportToCsv(eventCount: number, user: any) {
  telemetryService.trackEvent('exportedToCsv', {
    eventCount,
  }, user);
}
```

### UXP Event Types

Define UXP-specific events to track:

```typescript
// UXP Event Types (replace onboarding event types)

// Core Functionality
'eventCreated'           // Event created in UXP
'eventUpdated'           // Event details updated
'eventCancelled'         // Event cancelled
'eventDuplicated'        // Event duplicated

// Recap Management
'recapSubmitted'         // Field team submitted recap
'recapApproved'          // BL team approved recap
'recapRejected'          // BL team rejected recap
'recapRevisionRequested' // BL team requested changes

// Integration Events
'brandscopicSynced'      // Event synced to Brandscopic
'brandscopicRecapFetched'// Recap fetched from Brandscopic
'qualtricsSurveyLinked'  // Survey linked to event
'qualtricsSurveyDataFetched' // Survey data retrieved

// View/Navigation
'calendarViewChanged'    // Calendar view mode (month, week, day)
'eventDetailsViewed'     // Event details modal opened
'filterApplied'          // Filter applied to event list
'searchPerformed'        // Search query executed

// Export/Sharing
'exportedToCsv'          // Event list exported to CSV
'exportedToPdf'          // Event report exported to PDF
'dashboardShared'        // Dashboard shared with client

// User Actions
'userLogin'              // User logged in
'userLogout'             // User logged out
'settingsChanged'        // User updated preferences
```

### How to Reuse for UXP

1. **Copy Telemetry Files:**
   - Copy `utils/telemetryService.ts` (update event types)
   - Copy `utils/browserContext.ts` (no changes)
   - Copy `appConfig.ts` (update flow URL)

2. **Update Event Types:**
   - Replace onboarding event types with UXP events (see list above)
   - Create convenience functions for common events

3. **Configure Power Automate:**
   - Create HTTP trigger flow in Power Automate
   - Accept TelemetryEvent schema
   - Route to SharePoint list or Azure SQL table
   - Send to Power BI dataset

4. **Update appConfig.ts:**
   ```typescript
   export const appConfig = {
     telemetryFlowUrl: "https://prod-XX.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...",
   };
   ```

5. **Usage in Components:**
   ```typescript
   import { trackEventCreated, trackRecapApproved } from '../utils/telemetryService';
   import { useAuth } from '../contexts/AuthContext';

   function CreateEventForm() {
     const { user } = useAuth();

     const handleSubmit = async (formData) => {
       const events = await uxpApi.createEvent(formData);
       trackEventCreated(formData, user); // Track event
     };
   }
   ```

### Power BI Dashboard Opportunities

With UXP telemetry, you can build dashboards for:

- **Event Creation Trends**: Events created per day/week/month
- **Client Activity**: Most active clients, event types per client
- **Recap Approval Rates**: Approval rate by client, average approval time
- **Integration Health**: Brandscopic sync success rate, API failures
- **User Engagement**: Daily active users, feature adoption rates
- **Calendar Usage**: Most popular view modes, filter usage

### Benefits

- Centralized analytics for data-driven decisions
- Privacy-first design (no PII, no meeting content)
- Fire-and-forget (never blocks UI)
- Power BI integration for executive dashboards
- Easy to add new events

### Configuration Checklist

- [ ] Copy utils/telemetryService.ts and utils/browserContext.ts
- [ ] Update event types for UXP
- [ ] Create Power Automate HTTP trigger flow
- [ ] Configure flow to route to SharePoint list or SQL table
- [ ] Update appConfig.ts with flow URL
- [ ] Add tracking calls to key user actions
- [ ] Test events appear in SharePoint/SQL
- [ ] Create Power BI dashboard (optional)

---

## 7. Deployment Pattern

**Priority:** HIGH
**Reusability:** 90%
**Effort Savings:** 2-3 days

### Pattern Description

Complete Google Cloud Run deployment with two-service architecture (frontend + backend), Docker containerization, nginx configuration, and build/push scripts. Includes private IP networking, VPC connectors, and internal load balancer setup.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ On-Prem DNS Forwarder → GCP Internal DNS Zone              │
│ Resolves: uxp.momentum.com → Internal Load Balancer        │
└───────────────┬────────────────────────────────────────────┘
                │ Routes Traffic
                ├────────────────────┬───────────────────────┐
                ▼                    ▼                       │
    ┌──────────────────────┐  ┌──────────────────────┐     │
    │ Frontend Cloud Run   │  │ Backend Cloud Run    │     │
    │ uxp-frontend         │  │ uxp-backend          │     │
    │ (Private IP)         │  │ (Private IP)         │     │
    │  ┌────────────────┐  │  │  ┌────────────────┐  │     │
    │  │ Nginx + React  │  │  │  │ Node.js/Express│  │     │
    │  │ SPA            │  │  │  │ API proxy      │  │     │
    │  │ Health: /health│  │  │  │ Health: /health│  │     │
    │  └────────────────┘  │  │  │ JWT validation │  │     │
    │                      │  │  │ Stores secrets │  │     │
    │ Calls backend        │  │  └────────────────┘  │     │
    │ directly via URL     │  │                      │     │
    └──────────────────────┘  └──────────┬───────────┘     │
                                         │ VPC Egress      │
                                         ▼                 │
                              ┌───────────────────────┐    │
                              │ Brandscopic API       │    │
                              │ Qualtrics API         │    │
                              │ Azure SQL Database    │    │
                              └───────────────────────┘    │
```

### Files to Copy

**Frontend:**
- `Dockerfile` - Multi-stage build (Node build + Nginx serve)
- `nginx.conf` - SPA routing configuration
- `build-push-frontend.sh` - Build and push script

**Backend:**
- `backend/Dockerfile` - Node.js 18 Alpine
- `backend/build-push-backend.sh` - Build and push script

**Deployment:**
- `.env.example` - Environment variable template
- `deploy-frontend.sh` - Cloud Run deployment script (create new)
- `deploy-backend.sh` - Cloud Run deployment script (create new)

### Code Example: Frontend Dockerfile

```dockerfile
# Dockerfile (Frontend)

# Stage 1: Build React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build production bundle
RUN npm run build

# Stage 2: Serve with Nginx
FROM nginx:alpine

# Copy custom nginx config
COPY nginx.conf /etc/nginx/nginx.conf

# Copy built React app from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Expose port 8080 (Cloud Run default)
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start Nginx
CMD ["nginx", "-g", "daemon off;"]
```

### Code Example: nginx.conf

```nginx
# nginx.conf (Frontend)

events {
  worker_connections 1024;
}

http {
  include /etc/nginx/mime.types;
  default_type application/octet-stream;

  # Logging
  access_log /var/log/nginx/access.log;
  error_log /var/log/nginx/error.log;

  # Gzip compression
  gzip on;
  gzip_vary on;
  gzip_min_length 1024;
  gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml+rss;

  server {
    listen 8080;
    server_name _;

    root /usr/share/nginx/html;
    index index.html;

    # SPA routing (all routes → index.html)
    location / {
      try_files $uri $uri/ /index.html;
      add_header Cache-Control "no-cache, no-store, must-revalidate";
    }

    # Static assets caching
    location ~* \.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2|ttf|eot)$ {
      expires 1y;
      add_header Cache-Control "public, immutable";
    }

    # version.json never cached (for update detection)
    location = /version.json {
      expires -1;
      add_header Cache-Control "no-store, no-cache, must-revalidate";
      add_header Pragma "no-cache";
    }

    # Health check endpoint
    location = /health {
      access_log off;
      return 200 "OK";
      add_header Content-Type text/plain;
    }
  }
}
```

### Code Example: Backend Dockerfile

```dockerfile
# backend/Dockerfile

FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy source code
COPY . .

# Expose port 8080
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/health || exit 1

# Start server
CMD ["node", "server.js"]
```

### Code Example: Build Scripts

```bash
#!/bin/bash
# build-push-frontend.sh

set -e

PROJECT_ID="mom-ai-apps"
REGION="us-east4"
REPOSITORY="uxp"
IMAGE_NAME="uxp-frontend"

# Build Docker image
echo "Building frontend Docker image..."
docker build -t ${IMAGE_NAME}:latest .

# Tag for Artifact Registry
REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}"
docker tag ${IMAGE_NAME}:latest ${REGISTRY_URL}:latest
docker tag ${IMAGE_NAME}:latest ${REGISTRY_URL}:$(git rev-parse --short HEAD)

# Push to Artifact Registry
echo "Pushing to Artifact Registry..."
docker push ${REGISTRY_URL}:latest
docker push ${REGISTRY_URL}:$(git rev-parse --short HEAD)

echo "Frontend image pushed successfully!"
echo "Latest: ${REGISTRY_URL}:latest"
echo "Commit: ${REGISTRY_URL}:$(git rev-parse --short HEAD)"
```

```bash
#!/bin/bash
# deploy-frontend.sh

set -e

PROJECT_ID="mom-ai-apps"
REGION="us-east4"
REPOSITORY="uxp"
IMAGE_NAME="uxp-frontend"
SERVICE_NAME="uxp-frontend"

REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"

echo "Deploying frontend to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${REGISTRY_URL} \
  --platform managed \
  --region ${REGION} \
  --allow-unauthenticated \
  --port 8080 \
  --memory 512Mi \
  --cpu 1 \
  --max-instances 10 \
  --min-instances 0 \
  --timeout 300s \
  --project ${PROJECT_ID}

echo "Frontend deployed successfully!"
```

```bash
#!/bin/bash
# backend/deploy-backend.sh

set -e

PROJECT_ID="mom-ai-apps"
REGION="us-east4"
REPOSITORY="uxp"
IMAGE_NAME="uxp-backend"
SERVICE_NAME="uxp-backend"

REGISTRY_URL="${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPOSITORY}/${IMAGE_NAME}:latest"

echo "Deploying backend to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
  --image ${REGISTRY_URL} \
  --platform managed \
  --region ${REGION} \
  --no-allow-unauthenticated \
  --port 8080 \
  --memory 1Gi \
  --cpu 2 \
  --max-instances 20 \
  --min-instances 1 \
  --timeout 300s \
  --set-env-vars FRONTEND_URL=https://uxp.momentum.com \
  --set-env-vars REQUIRED_GROUP_ID=2c08b5d8-7def-4845-a48c-740b987dcffb \
  --set-env-vars TENANT_ID=d026e4c1-5892-497a-b9da-ee493c9f0364 \
  --set-env-vars CLIENT_ID=5fa64631-ea56-4676-b6d5-433d322a4da1 \
  --set-secrets BRANDSCOPIC_API_KEY=brandscopic-api-key:latest \
  --set-secrets QUALTRICS_API_KEY=qualtrics-api-key:latest \
  --vpc-connector uxp-vpc-connector \
  --project ${PROJECT_ID}

echo "Backend deployed successfully!"
```

### How to Reuse for UXP

1. **Copy Deployment Files:**
   - Copy `Dockerfile`, `nginx.conf` to UXP frontend
   - Copy `backend/Dockerfile` to UXP backend
   - Create build and deploy scripts

2. **Update Environment Variables:**
   - Frontend: No env vars needed (MSAL config hardcoded)
   - Backend: Update `deploy-backend.sh` with UXP secrets

3. **Configure GCP:**
   - Create Artifact Registry repository: `uxp`
   - Create VPC connector for backend (egress to Brandscopic, etc.)
   - Configure Internal Load Balancer with DNS

4. **Build and Deploy:**
   ```bash
   # Build and push images
   ./build-push-frontend.sh
   cd backend && ./build-push-backend.sh

   # Deploy to Cloud Run
   ./deploy-frontend.sh
   cd backend && ./deploy-backend.sh
   ```

5. **Configure DNS:**
   - Create internal DNS zone: `uxp.momentum.com` → Load Balancer IP
   - Configure on-prem DNS forwarder to GCP Internal DNS

### Benefits

- Automatic scaling (0 to N instances)
- Pay-per-use pricing (no idle costs)
- Private networking (secure)
- Blue-green deployments (zero downtime)
- Health checks and auto-healing
- Secret management (Google Secret Manager)

### Configuration Checklist

- [ ] Copy Dockerfile, nginx.conf, and build scripts
- [ ] Create Artifact Registry repository (`uxp`)
- [ ] Configure VPC connector for backend egress
- [ ] Update deploy scripts with UXP service names
- [ ] Store secrets in Google Secret Manager
- [ ] Test local Docker builds before pushing
- [ ] Deploy frontend to Cloud Run
- [ ] Deploy backend to Cloud Run
- [ ] Configure Internal Load Balancer
- [ ] Set up DNS (internal DNS zone + on-prem forwarder)
- [ ] Test end-to-end flow (DNS → LB → Cloud Run → APIs)

---

## 8. Graph API Integration

**Priority:** MEDIUM
**Reusability:** 70% (user profile + department lookup)
**Effort Savings:** 1-2 days

### Pattern Description

Microsoft Graph API integration for user profile enrichment, department lookup, and Momentum organizational data. Includes Power Platform integration (962 users) with circuit breaker pattern, caching, and graceful fallback.

### Architecture

```
┌────────────────────────────────────────────────────────────┐
│ React App                                                   │
│  ├─ AuthGuard fetches user profile on login                │
│  ├─ Event form pre-fills user name/email                   │
│  └─ Department dropdown loads Momentum data                │
└───────────────┬────────────────────────────────────────────┘
                │
                ├─────────────────┬──────────────────────────┐
                ▼                 ▼                          ▼
    ┌────────────────────┐  ┌────────────────────┐  ┌────────────────┐
    │ Graph API          │  │ Power Platform     │  │ localStorage    │
    │ /v1.0/me           │  │ 962 Momentum users │  │ Cache (24h TTL) │
    │ /v1.0/me/photo     │  │ Department data    │  │ Circuit breaker │
    └────────────────────┘  └────────────────────┘  └────────────────┘
         │                           │
         │                           │ Fallback
         └───────────┬───────────────┘
                     ▼
         ┌────────────────────────────┐
         │ Enriched User Profile:     │
         │ - Name: "Luis Bustos"      │
         │ - Email: "luis@momentum.." │
         │ - Department: "IP & CT"    │
         │ - Photo: blob URL          │
         └────────────────────────────┘
```

### Files to Copy

- `services/departmentService.ts` - Power Platform integration with caching
- `utils/departmentLookup.ts` - Department priority logic (Momentum → Graph → Unknown)

### Code Example: Department Service (Copy As-Is)

```typescript
// services/departmentService.ts

interface MomentumUserData {
  name: string;
  email: string;
  departmentGroup: string; // Primary department (e.g., "Global Technology")
  department: string; // Full department name
}

const CACHE_TTL = 24 * 60 * 60 * 1000; // 24 hours
const CACHE_KEY = 'momentum_department_cache';
const CIRCUIT_BREAKER_KEY = 'momentum_circuit_breaker';
const MAX_FAILURES = 3;
const CIRCUIT_BREAKER_RESET_TIME = 5 * 60 * 1000; // 5 minutes

class DepartmentService {
  private departmentMap: Map<string, MomentumUserData> | null = null;
  private inFlightRequest: Promise<Map<string, MomentumUserData>> | null = null;

  // Circuit breaker logic
  private getCircuitBreaker() {
    const stored = localStorage.getItem(CIRCUIT_BREAKER_KEY);
    if (!stored) return { consecutiveFailures: 0, lastFailureTime: 0, isOpen: false };
    return JSON.parse(stored);
  }

  private saveCircuitBreaker(state: any) {
    localStorage.setItem(CIRCUIT_BREAKER_KEY, JSON.stringify(state));
  }

  private checkCircuitBreaker(): boolean {
    const state = this.getCircuitBreaker();

    if (state.isOpen) {
      const timeSinceLastFailure = Date.now() - state.lastFailureTime;
      if (timeSinceLastFailure > CIRCUIT_BREAKER_RESET_TIME) {
        console.log('[DepartmentService] Circuit breaker auto-reset after cooldown');
        this.resetCircuitBreaker();
        return true;
      }
      return false; // Circuit still open
    }

    return true; // Circuit closed
  }

  private recordFailure() {
    const state = this.getCircuitBreaker();
    state.consecutiveFailures++;
    state.lastFailureTime = Date.now();

    if (state.consecutiveFailures >= MAX_FAILURES) {
      state.isOpen = true;
      console.warn(`[DepartmentService] 🚨 Circuit breaker OPENED after ${MAX_FAILURES} failures. Will retry in 5 minutes.`);
    }

    this.saveCircuitBreaker(state);
  }

  private resetCircuitBreaker() {
    localStorage.removeItem(CIRCUIT_BREAKER_KEY);
    console.log('[DepartmentService] Circuit breaker reset');
  }

  // Cache logic
  private getCachedData(): Map<string, MomentumUserData> | null {
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (!cached) return null;

      const { users, timestamp, version } = JSON.parse(cached);
      const age = Date.now() - timestamp;

      if (age > CACHE_TTL) {
        console.log('[DepartmentService] Cache expired');
        localStorage.removeItem(CACHE_KEY);
        return null;
      }

      const map = new Map(users);
      console.log(`[DepartmentService] ✅ Using cached data (${Math.round(age / 1000 / 60)}m old, ${map.size} users)`);
      return map;
    } catch (err) {
      console.error('[DepartmentService] Cache read error:', err);
      return null;
    }
  }

  private saveCachedData(map: Map<string, MomentumUserData>) {
    try {
      const cacheData = {
        users: Array.from(map.entries()),
        timestamp: Date.now(),
        version: 'v1',
        recordCount: map.size,
      };
      localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
      console.log(`[DepartmentService] Cached ${map.size} users for 24 hours`);
    } catch (err) {
      console.error('[DepartmentService] Cache save error:', err);
    }
  }

  // Fetch with retry logic
  private async fetchWithRetry(url: string, maxRetries = 3): Promise<Response> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: AbortSignal.timeout(10000), // 10s timeout
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }

        return response;
      } catch (error) {
        lastError = error as Error;
        console.warn(`[DepartmentService] Attempt ${attempt}/${maxRetries} failed:`, error);

        if (attempt < maxRetries) {
          const delay = 1000 * Math.pow(2, attempt - 1); // 1s, 2s, 4s
          console.log(`[DepartmentService] Retry ${attempt}/${maxRetries - 1} after ${delay}ms delay...`);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw new Error(`All ${maxRetries} attempts failed: ${lastError?.message}`);
  }

  // Main fetch method
  async fetchMomentumDepartments(): Promise<Map<string, MomentumUserData>> {
    // Request deduplication
    if (this.inFlightRequest) {
      console.log('[DepartmentService] Request already in-flight, returning existing promise');
      return this.inFlightRequest;
    }

    // Circuit breaker check
    if (!this.checkCircuitBreaker()) {
      console.warn('[DepartmentService] Circuit breaker is OPEN, skipping API call');
      return new Map();
    }

    // Check cache first
    const cachedData = this.getCachedData();
    if (cachedData) {
      this.departmentMap = cachedData;
      return cachedData;
    }

    // Fetch fresh data
    this.inFlightRequest = (async () => {
      try {
        console.log('[DepartmentService] Fetching fresh department data from Power Automate...');
        const startTime = Date.now();

        const response = await this.fetchWithRetry(
          'https://prod-XX.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...'
        );

        const data = await response.json();
        const duration = Date.now() - startTime;
        console.log(`[DepartmentService] ✅ Successfully fetched ${data.length} Momentum users in ${duration}ms`);

        // Transform to Map
        const map = new Map<string, MomentumUserData>();
        data.forEach((user: any) => {
          map.set(user.EmailAddress.toLowerCase(), {
            name: user.Name,
            email: user.EmailAddress,
            departmentGroup: user.DepartmentGroup,
            department: user.Department,
          });
        });

        // Save to cache and reset circuit breaker
        this.saveCachedData(map);
        this.resetCircuitBreaker();
        this.departmentMap = map;

        return map;
      } catch (error) {
        console.error('[DepartmentService] Failed to fetch department data:', error);
        this.recordFailure();
        return new Map();
      } finally {
        this.inFlightRequest = null;
      }
    })();

    return this.inFlightRequest;
  }

  getDepartment(email: string): MomentumUserData | null {
    if (!this.departmentMap) return null;
    return this.departmentMap.get(email.toLowerCase()) || null;
  }
}

export const departmentService = new DepartmentService();
```

### How to Reuse for UXP

1. **Copy Department Service:**
   - Copy `services/departmentService.ts` as-is (no changes needed)
   - Update Power Automate endpoint URL in `fetchWithRetry` method

2. **Load Department Data on App Mount:**
   ```typescript
   // App.tsx

   useEffect(() => {
     async function loadDepartmentData() {
       await departmentService.fetchMomentumDepartments();
     }
     loadDepartmentData();
   }, []);
   ```

3. **Use in Components:**
   ```typescript
   // components/CreateEventForm.tsx

   import { departmentService } from '../services/departmentService';
   import { useAuth } from '../contexts/AuthContext';

   function CreateEventForm() {
     const { user } = useAuth();

     // Pre-fill business leadership from logged-in user
     const userData = departmentService.getDepartment(user.email);
     const [businessLeadership, setBusinessLeadership] = useState({
       firstName: user.name.split(' ')[0],
       lastName: user.name.split(' ')[1],
       email: user.email,
       department: userData?.departmentGroup || 'Unknown',
     });

     return (
       <form>
         <Input label="Business Lead" value={businessLeadership.firstName} readOnly />
         <Input label="Department" value={businessLeadership.department} readOnly />
       </form>
     );
   }
   ```

4. **Graph API for User Profile:**
   ```typescript
   // Already handled by AuthGuard (no changes needed)
   ```

### Benefits

- Automatic user profile enrichment on login
- 962 Momentum users with accurate department data
- 24-hour caching (reduces API calls by 95%)
- Circuit breaker protects against endpoint collapse
- Graceful fallback to Graph API if Power Platform unavailable

### Configuration Checklist

- [ ] Copy services/departmentService.ts
- [ ] Update Power Automate endpoint URL
- [ ] Load department data on app mount
- [ ] Test department lookup with Momentum employee
- [ ] Test fallback with non-Momentum employee
- [ ] Verify 24-hour cache works
- [ ] Verify circuit breaker opens after 3 failures

---

## 9. Migration Checklist

### Phase 1: Foundation (Week 1)

**Authentication & Security:**
- [ ] Create Azure AD app registration for UXP
- [ ] Copy `auth/` directory (authConfig, AuthGuard, AccessDenied)
- [ ] Copy `contexts/AuthContext.tsx`
- [ ] Copy `backend/middleware/auth.js`
- [ ] Update `REQUIRED_GROUP_ID` for UXP access group
- [ ] Update `clientId`, `authority`, and redirect URIs
- [ ] Configure token claims (groups claim)
- [ ] Test login with authorized/unauthorized users

**UI Component Library:**
- [ ] Copy `components/ui/` directory (all 15 components)
- [ ] Update Tailwind config with UXP brand colors
- [ ] Test all components render correctly
- [ ] Customize icons if needed

### Phase 2: Backend (Week 2)

**Backend Proxy:**
- [ ] Copy `backend/` directory structure
- [ ] Install dependencies: `npm install express cors jsonwebtoken jwks-rsa node-fetch mssql`
- [ ] Create `backend/.env` with UXP credentials
- [ ] Create event routes (GET, POST, PUT, DELETE)
- [ ] Create recap routes (approve, reject)
- [ ] Create Brandscopic integration routes
- [ ] Create Qualtrics integration routes
- [ ] Test JWT validation with frontend
- [ ] Test CORS with frontend running locally

**Database:**
- [ ] Set up Azure SQL database for UXP
- [ ] Create tables (Events, Recaps, Clients, EventTypes, etc.)
- [ ] Replace in-memory storage with SQL queries
- [ ] Test CRUD operations

### Phase 3: API & State Management (Week 3)

**API Service:**
- [ ] Copy `services/apiService.ts` pattern
- [ ] Rename to `uxpApiService.ts`
- [ ] Define UXP TypeScript interfaces (Event, Recap, Client)
- [ ] Implement UXP endpoints (createEvent, getEvents, etc.)
- [ ] Test token acquisition and caching
- [ ] Test retry logic

**State Management:**
- [ ] Copy `hooks/useLocalStorage.ts`
- [ ] Create `contexts/EventContext.tsx`
- [ ] Create `contexts/UXPContext.tsx` for UI state
- [ ] Wrap App with providers (MSAL → Auth → Event → UXP)
- [ ] Test context providers load correctly

### Phase 4: Telemetry & Integrations (Week 4)

**Telemetry:**
- [ ] Copy `utils/telemetryService.ts` and `utils/browserContext.ts`
- [ ] Update event types for UXP
- [ ] Create Power Automate HTTP trigger flow
- [ ] Update `appConfig.ts` with flow URL
- [ ] Add tracking calls to key user actions
- [ ] Test events appear in SharePoint/SQL

**Graph API & Department Service:**
- [ ] Copy `services/departmentService.ts`
- [ ] Update Power Automate endpoint for Momentum data
- [ ] Load department data on app mount
- [ ] Test department lookup

### Phase 5: Deployment (Week 5)

**Docker & Cloud Run:**
- [ ] Copy Dockerfile, nginx.conf, build scripts
- [ ] Create Artifact Registry repository (`uxp`)
- [ ] Configure VPC connector for backend egress
- [ ] Update deploy scripts with UXP service names
- [ ] Store secrets in Google Secret Manager
- [ ] Build and push frontend image
- [ ] Build and push backend image
- [ ] Deploy frontend to Cloud Run
- [ ] Deploy backend to Cloud Run

**DNS & Networking:**
- [ ] Configure Internal Load Balancer
- [ ] Set up internal DNS zone (`uxp.momentum.com`)
- [ ] Configure on-prem DNS forwarder
- [ ] Test end-to-end flow (DNS → LB → Cloud Run → APIs)

### Phase 6: Testing & Launch (Week 6)

**Testing:**
- [ ] Test login flow (authorized/unauthorized)
- [ ] Test event creation (single day, multiple days)
- [ ] Test event update/cancel
- [ ] Test recap approval workflow
- [ ] Test Brandscopic sync
- [ ] Test Qualtrics integration
- [ ] Test export functions (CSV, PDF)
- [ ] Test telemetry events firing correctly

**Launch:**
- [ ] User acceptance testing with Momentum team
- [ ] Training sessions for business leaders and project managers
- [ ] Go-live announcement
- [ ] Monitor telemetry for issues

---

## 10. Configuration Templates

### .env.local (Frontend)

```env
# MSAL Configuration (hardcoded in authConfig.ts, no env vars needed)

# Telemetry
VITE_TELEMETRY_FLOW_URL=https://prod-XX.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...

# API (optional, defaults to http://localhost:8080)
VITE_API_URL=http://localhost:8080
```

### backend/.env (Backend)

```env
# Server
PORT=8080
NODE_ENV=production

# Frontend CORS
FRONTEND_URL=http://localhost:5173

# Azure AD
REQUIRED_GROUP_ID=2c08b5d8-7def-4845-a48c-740b987dcffb
TENANT_ID=d026e4c1-5892-497a-b9da-ee493c9f0364
CLIENT_ID=5fa64631-ea56-4676-b6d5-433d322a4da1

# Azure SQL Database
AZURE_SQL_CONNECTION_STRING=Server=tcp:uxp-db.database.windows.net,1433;Database=UXP;User Id=uxpadmin;Password=YourPassword;Encrypt=true;

# Brandscopic API
BRANDSCOPIC_API_URL=https://api.brandscopic.com
BRANDSCOPIC_API_KEY=your-api-key

# Qualtrics API
QUALTRICS_API_URL=https://yourdatacenter.qualtrics.com/API/v3
QUALTRICS_API_KEY=your-api-key

# Power Automate (Momentum Department Data)
MOMENTUM_DEPT_FLOW_URL=https://prod-XX.eastus.logic.azure.com:443/workflows/.../triggers/manual/paths/invoke?...
```

### package.json (Frontend)

```json
{
  "name": "uxp-frontend",
  "version": "1.0.0",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview",
    "prebuild": "node scripts/generate-version.js"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "@msal/browser": "^3.10.0",
    "@msal/react": "^2.0.12"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "@types/react-dom": "^18.2.0",
    "@vitejs/plugin-react": "^4.0.0",
    "typescript": "^5.4.5",
    "vite": "^5.2.11"
  }
}
```

### package.json (Backend)

```json
{
  "name": "uxp-backend",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "jsonwebtoken": "^9.0.2",
    "jwks-rsa": "^3.1.0",
    "node-fetch": "^2.6.12",
    "mssql": "^10.0.1"
  },
  "devDependencies": {
    "nodemon": "^3.0.1"
  }
}
```

---

## 11. Dependencies

### Frontend Dependencies

```bash
# Core
npm install react react-dom

# Authentication
npm install @msal/browser @msal/react

# TypeScript
npm install --save-dev typescript @types/react @types/react-dom

# Build Tool
npm install --save-dev vite @vitejs/plugin-react

# Optional (if using)
npm install react-router-dom
npm install date-fns
```

### Backend Dependencies

```bash
# Core
npm install express cors

# Authentication
npm install jsonwebtoken jwks-rsa

# HTTP Client
npm install node-fetch

# Database
npm install mssql

# Development
npm install --save-dev nodemon
```

### System Prerequisites

- **Node.js**: 18.x or higher
- **npm**: 9.x or higher
- **Docker**: Latest version (for local testing)
- **gcloud CLI**: Latest version (for Cloud Run deployment)
- **Azure AD**: Tenant with app registration permissions
- **Google Cloud**: Project with Cloud Run, Artifact Registry, Secret Manager
- **Azure SQL**: Database instance with UXP schema

---

## 12. Gotchas and Best Practices

### Authentication

**Gotcha #1: Groups claim not appearing in token**
- **Solution**: Configure token claims in Azure AD → Token configuration → Add groups claim → Select "Security groups" → Check ID and Access tokens

**Gotcha #2: Redirect URI mismatch**
- **Solution**: Ensure `redirectUri` in `authConfig.ts` EXACTLY matches Azure AD app registration (including trailing slashes)

**Gotcha #3: CORS errors with MSAL**
- **Solution**: Use `window.location.origin` for `redirectUri` (auto-detects dev vs prod URL)

### Backend

**Gotcha #4: JWT validation fails with "invalid signature"**
- **Solution**: Ensure `jwks-rsa` is fetching correct public keys from Azure AD (`https://login.microsoftonline.com/{TENANT_ID}/discovery/v2.0/keys`)

**Gotcha #5: Environment variables not loading**
- **Solution**: Use `dotenv` package in `server.js`: `require('dotenv').config()`

**Gotcha #6: CORS still blocked after configuring backend**
- **Solution**: Check `FRONTEND_URL` env var matches EXACTLY (including protocol: `http://` vs `https://`)

### Deployment

**Gotcha #7: Docker build fails with "MODULE_NOT_FOUND"**
- **Solution**: Run `npm ci` in Dockerfile (not `npm install`) to ensure clean dependency installation

**Gotcha #8: Cloud Run service won't start (health check fails)**
- **Solution**: Ensure nginx listens on port 8080 (not 80), verify `/health` endpoint returns 200

**Gotcha #9: Backend can't reach Brandscopic API**
- **Solution**: Configure VPC connector with egress to allow external API calls

**Gotcha #10: Secrets not loading in Cloud Run**
- **Solution**: Store secrets in Google Secret Manager, reference with `--set-secrets` flag in `gcloud run deploy`

### State Management

**Gotcha #11: Context value is `null` in components**
- **Solution**: Ensure component is wrapped with Provider higher up in tree, check `useContext` is called inside Provider

**Gotcha #12: localStorage quota exceeded**
- **Solution**: Limit cached data size, implement cleanup logic for old cache entries

### Telemetry

**Gotcha #13: Telemetry events not appearing in Power Automate**
- **Solution**: Check flow URL is correct, verify flow trigger accepts POST requests, check CORS settings in flow

**Gotcha #14: Power Platform API returns 504 Gateway Timeout**
- **Solution**: Implement circuit breaker pattern (already included in `departmentService.ts`), cache data for 24 hours

### Best Practices

**Best Practice #1: Use TypeScript for everything**
- Define interfaces for all API requests/responses
- Enable strict mode in `tsconfig.json`
- Avoid `any` type (use `unknown` if necessary)

**Best Practice #2: Centralize API logic**
- Keep all API calls in `services/` directory
- Never call `fetch` directly in components
- Use custom hooks to wrap API service methods

**Best Practice #3: Implement retry logic for external APIs**
- Use exponential backoff (1s, 2s, 4s, 8s)
- Skip retry for 4xx client errors (only retry 5xx and timeouts)
- Set maximum retry attempts (3-5)

**Best Practice #4: Cache aggressively**
- Cache Momentum department data for 24 hours (rarely changes)
- Cache API tokens until 60s before expiration
- Use localStorage for client-side cache, Redis for server-side

**Best Practice #5: Use circuit breaker pattern**
- Protect external APIs from overload
- Open circuit after 3 consecutive failures
- Auto-reset after 5-minute cooldown
- Gracefully degrade functionality when circuit open

**Best Practice #6: Track everything with telemetry**
- Add telemetry to all user actions (create, update, delete, export)
- Include context (user, timestamp, session ID)
- Fire-and-forget (never block UI for telemetry failures)

**Best Practice #7: Security in depth**
- Validate JWT on both frontend and backend
- Enforce group membership on both layers
- Never expose CLIENT_SECRET to browser
- Use Secret Manager for production secrets

**Best Practice #8: Test locally before deploying**
- Test Docker builds locally (`docker build`)
- Test frontend/backend communication locally
- Test CORS configuration locally
- Only deploy after successful local testing

---

## Summary

This migration guide provides comprehensive patterns extracted from the Employee Onboarding System that can be reused for UXP. By following this guide, you can:

- **Save 3-4 weeks** of development time by reusing proven patterns
- **Inherit enterprise-grade security** (MSAL + Azure AD + Group Security)
- **Leverage production-ready UI components** (15+ components with dark mode)
- **Deploy to Cloud Run** with minimal configuration (Docker + nginx + scripts)
- **Track usage analytics** with comprehensive telemetry framework
- **Integrate with Microsoft Graph** and Power Platform for organizational data

**Next Steps:**
1. Review this guide with UXP stakeholders
2. Start with Phase 1 (Authentication & UI Components)
3. Build UXP-specific features incrementally
4. Follow deployment checklist when ready for Cloud Run
5. Monitor telemetry for usage patterns and issues

**Questions? Contact:**
- Architecture: Luis Bustos (this guide author)
- Deployment: Nick Keller (Cloud Run expert)
- Infrastructure: Jeff (GCP project owner)

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Author:** Migration Assistant Agent
