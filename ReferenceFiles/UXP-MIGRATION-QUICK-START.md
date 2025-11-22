# UXP Migration Quick Start Guide

> **Fast-track guide for migrating Employee Onboarding System patterns to UXP**

---

## 30-Minute Setup (Minimal Viable Product)

### Step 1: Authentication (10 minutes)

```bash
# 1. Copy authentication files
cp -r reference/auth/ uxp/src/auth/
cp -r reference/contexts/AuthContext.tsx uxp/src/contexts/
cp -r reference/backend/middleware/auth.js uxp/backend/middleware/

# 2. Update Azure AD configuration
# Edit: uxp/src/auth/authConfig.ts
#   - Replace clientId: "YOUR_UXP_CLIENT_ID"
#   - Replace authority: "https://login.microsoftonline.com/YOUR_TENANT_ID"
#   - Replace REQUIRED_GROUP_ID: "YOUR_UXP_GROUP_ID"

# 3. Test login
npm run dev
# Navigate to http://localhost:5173
# Click "Sign in with Microsoft"
# Verify login works
```

### Step 2: UI Components (10 minutes)

```bash
# Copy component library
cp -r reference/components/ui/ uxp/src/components/ui/

# Test components work
# Create test file: uxp/src/TestComponents.tsx
```

```tsx
import { Button, Card, Input, Select, Toast } from './components/ui';

function TestComponents() {
  return (
    <div className="p-8 space-y-4">
      <Card>
        <h2>Component Test</h2>
        <Input label="Event Name" />
        <Select label="Event Type" options={['Conference', 'Trade Show']} />
        <Button variant="primary">Create Event</Button>
      </Card>
    </div>
  );
}
```

### Step 3: API Service (10 minutes)

```bash
# 1. Copy API service pattern
cp reference/services/apiService.ts uxp/src/services/uxpApiService.ts

# 2. Update endpoints
# Edit: uxp/src/services/uxpApiService.ts
#   - Update API_BASE_URL
#   - Replace methods with UXP endpoints (createEvent, getEvents, etc.)

# 3. Create simple test
```

```typescript
// Test API service
import { uxpApi } from './services/uxpApiService';

async function testApi() {
  const events = await uxpApi.getEvents();
  console.log('Events:', events);
}

testApi();
```

---

## 2-Hour MVP (Frontend + Backend)

### Frontend Setup (60 minutes)

**1. Project Initialization (10 min)**

```bash
# Create new React + TypeScript project
npm create vite@latest uxp-frontend -- --template react-ts
cd uxp-frontend
npm install

# Install dependencies
npm install @msal/browser @msal/react
npm install react-router-dom date-fns

# Install Tailwind CSS
npm install -D tailwindcss postcss autoprefixer
npx tailwindcss init -p
```

**2. Copy Core Files (20 min)**

```bash
# Authentication
mkdir -p src/auth src/contexts
cp reference/auth/* src/auth/
cp reference/contexts/AuthContext.tsx src/contexts/

# UI Components
mkdir -p src/components/ui
cp reference/components/ui/* src/components/ui/

# Services
mkdir -p src/services src/hooks src/utils
cp reference/services/apiService.ts src/services/uxpApiService.ts
cp reference/hooks/useLocalStorage.ts src/hooks/
cp reference/utils/telemetryService.ts src/utils/
cp reference/utils/browserContext.ts src/utils/
```

**3. Configure App (20 min)**

```tsx
// src/App.tsx

import { MsalProvider } from '@msal/react';
import { PublicClientApplication } from '@msal/browser';
import AuthGuard from './auth/AuthGuard';
import { AuthProvider } from './contexts/AuthContext';
import { msalConfig } from './auth/authConfig';

const msalInstance = new PublicClientApplication(msalConfig);

function App() {
  return (
    <MsalProvider instance={msalInstance}>
      <AuthGuard>
        <AuthProvider>
          <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
            <h1>UXP - Unified Experience Platform</h1>
            {/* Your components here */}
          </div>
        </AuthProvider>
      </AuthGuard>
    </MsalProvider>
  );
}

export default App;
```

**4. Update Configuration (10 min)**

```typescript
// src/auth/authConfig.ts - Update these values

export const REQUIRED_GROUP_ID = 'YOUR_UXP_GROUP_ID_HERE';

export const msalConfig = {
  auth: {
    clientId: "YOUR_UXP_CLIENT_ID",
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID",
    redirectUri: window.location.origin,
  },
  // ... rest stays the same
};
```

### Backend Setup (60 minutes)

**1. Initialize Backend (10 min)**

```bash
# Create backend directory
mkdir uxp-backend
cd uxp-backend

# Initialize npm
npm init -y

# Install dependencies
npm install express cors jsonwebtoken jwks-rsa node-fetch mssql dotenv
npm install --save-dev nodemon
```

**2. Copy Backend Files (15 min)**

```bash
# Copy middleware
mkdir middleware
cp ../reference/backend/middleware/auth.js middleware/

# Copy server structure
cp ../reference/backend/server.js server.js

# Create routes directory
mkdir -p routes/integrations
```

**3. Create Environment File (5 min)**

```bash
# .env

PORT=8080
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Azure AD
REQUIRED_GROUP_ID=YOUR_UXP_GROUP_ID
TENANT_ID=YOUR_TENANT_ID
CLIENT_ID=YOUR_CLIENT_ID

# Database (add when ready)
# AZURE_SQL_CONNECTION_STRING=...

# APIs (add when ready)
# BRANDSCOPIC_API_URL=...
# BRANDSCOPIC_API_KEY=...
```

**4. Create Event Routes (20 min)**

```javascript
// routes/events.js

const express = require('express');
const router = express.Router();

// Mock database (replace with Azure SQL later)
let events = [];

// GET /api/events - List events
router.get('/', (req, res) => {
  res.json(events);
});

// POST /api/events - Create event
router.post('/', (req, res) => {
  const newEvent = {
    id: Date.now().toString(),
    ...req.body,
    createdBy: req.user.preferred_username,
    createdAt: new Date().toISOString(),
  };
  events.push(newEvent);
  res.status(201).json(newEvent);
});

// PUT /api/events/:id - Update event
router.put('/:id', (req, res) => {
  const index = events.findIndex(e => e.id === req.params.id);
  if (index === -1) {
    return res.status(404).json({ error: 'Event not found' });
  }
  events[index] = { ...events[index], ...req.body };
  res.json(events[index]);
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', (req, res) => {
  events = events.filter(e => e.id !== req.params.id);
  res.status(204).send();
});

module.exports = router;
```

**5. Update Server (10 min)**

```javascript
// server.js

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const authMiddleware = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 8080;

// CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true,
}));

// Body parser
app.use(express.json());

// Health check (no auth)
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Protected routes (require JWT + group membership)
app.use('/api/events', authMiddleware, require('./routes/events'));

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`UXP Backend listening on port ${PORT}`);
});
```

---

## Test Your MVP

### Frontend Test

```bash
cd uxp-frontend
npm run dev
```

Open http://localhost:5173 and verify:
- [ ] Login page appears
- [ ] Can sign in with Microsoft account
- [ ] Access denied page shows for unauthorized users
- [ ] App loads for authorized users

### Backend Test

```bash
cd uxp-backend
npm run dev
```

Test endpoints:

```bash
# Health check (no auth)
curl http://localhost:8080/health

# Create event (requires JWT token)
# Get token from frontend (browser DevTools → Application → Session Storage → msal.token...)
curl -X POST http://localhost:8080/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"eventName": "Test Event", "eventDate": "2025-12-01"}'

# List events
curl http://localhost:8080/api/events \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## Next Steps (Priority Order)

### Week 1: Core Features

**Day 1-2: Event Creation**
- [ ] Create EventForm component
- [ ] Implement date range picker
- [ ] Add client/event type dropdowns
- [ ] Connect to backend API

**Day 3-4: Event List**
- [ ] Create EventList component
- [ ] Add filters (client, date range, status)
- [ ] Add search functionality
- [ ] Implement pagination

**Day 5: Calendar View**
- [ ] Create CalendarView component
- [ ] Display events on calendar
- [ ] Click event to view details
- [ ] Color-code by status

### Week 2: Integrations

**Day 1-2: Brandscopic Integration**
- [ ] Create Brandscopic API proxy in backend
- [ ] Implement "Sync to Brandscopic" button
- [ ] Store Brandscopic project ID
- [ ] Handle sync errors gracefully

**Day 3-4: Database Migration**
- [ ] Set up Azure SQL database
- [ ] Create tables (Events, Clients, EventTypes)
- [ ] Replace in-memory storage with SQL queries
- [ ] Test CRUD operations

**Day 5: Recap Workflow**
- [ ] Create RecapApproval component
- [ ] Fetch recap data from Brandscopic
- [ ] Implement approve/reject buttons
- [ ] Send approval status back to Brandscopic

### Week 3: Polish & Deploy

**Day 1-2: Telemetry**
- [ ] Add telemetry tracking to all actions
- [ ] Create Power Automate flow
- [ ] Test events appear in SharePoint

**Day 3-4: Deployment**
- [ ] Copy Dockerfile and nginx.conf
- [ ] Build Docker images
- [ ] Deploy to Cloud Run
- [ ] Configure DNS

**Day 5: Testing & Launch**
- [ ] User acceptance testing
- [ ] Fix bugs
- [ ] Go-live!

---

## Common Commands

### Development

```bash
# Frontend
npm run dev              # Start dev server
npm run build            # Build for production
npm run preview          # Preview production build

# Backend
npm run dev              # Start with nodemon (auto-reload)
npm start                # Start production server

# Both
npm install              # Install dependencies
npm run lint             # Run linter
```

### Docker

```bash
# Build images
docker build -t uxp-frontend .
docker build -t uxp-backend backend/

# Run locally
docker run -p 8080:8080 uxp-frontend
docker run -p 8080:8080 --env-file backend/.env uxp-backend

# Push to Artifact Registry
docker tag uxp-frontend us-east4-docker.pkg.dev/mom-ai-apps/uxp/uxp-frontend:latest
docker push us-east4-docker.pkg.dev/mom-ai-apps/uxp/uxp-frontend:latest
```

### Cloud Run

```bash
# Deploy frontend
gcloud run deploy uxp-frontend \
  --image us-east4-docker.pkg.dev/mom-ai-apps/uxp/uxp-frontend:latest \
  --region us-east4 \
  --allow-unauthenticated

# Deploy backend
gcloud run deploy uxp-backend \
  --image us-east4-docker.pkg.dev/mom-ai-apps/uxp/uxp-backend:latest \
  --region us-east4 \
  --no-allow-unauthenticated \
  --set-env-vars FRONTEND_URL=https://uxp.momentum.com \
  --set-secrets BRANDSCOPIC_API_KEY=brandscopic-key:latest
```

---

## Troubleshooting

### Frontend Issues

**Problem: "Cannot find module '@msal/react'"**
```bash
npm install @msal/browser @msal/react
```

**Problem: CORS error when calling backend**
```bash
# Check backend .env has correct FRONTEND_URL
echo $FRONTEND_URL  # Should be http://localhost:5173
```

**Problem: Login redirects to wrong URL**
```typescript
// Check authConfig.ts has correct redirectUri
redirectUri: window.location.origin  // Should auto-detect
```

### Backend Issues

**Problem: "Cannot find module 'express'"**
```bash
cd backend
npm install express cors jsonwebtoken jwks-rsa
```

**Problem: JWT validation fails**
```bash
# Check .env has correct values
echo $TENANT_ID
echo $CLIENT_ID
echo $REQUIRED_GROUP_ID
```

**Problem: Events not persisting**
```bash
# This is expected! Using in-memory storage
# Events reset on server restart
# Migrate to Azure SQL to persist data
```

---

## Resources

- **Full Pattern Guide**: UXP-REUSABLE-PATTERNS.md (comprehensive documentation)
- **Reference Code**: /home/user/UXP/ReferenceFiles/ (CLAUDE.md documentation)
- **Azure AD Setup**: https://portal.azure.com → App registrations
- **Cloud Run Docs**: https://cloud.google.com/run/docs
- **MSAL Docs**: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview

---

**Document Version:** 1.0
**Last Updated:** 2025-11-22
**Estimated Time to MVP:** 2-3 hours (with reference code)
**Estimated Time to Production:** 3-4 weeks (following full migration checklist)
