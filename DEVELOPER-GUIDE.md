# UXP Developer Guide

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Platform**: Unified Experience Platform (UXP)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Development Environment Setup](#2-development-environment-setup)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Data Model](#5-data-model)
6. [Adding New Features](#6-adding-new-features)
7. [Testing Strategy](#7-testing-strategy)
8. [Deployment](#8-deployment)
9. [Common Tasks](#9-common-tasks)
10. [Code Style & Best Practices](#10-code-style--best-practices)
11. [Troubleshooting Development Issues](#11-troubleshooting-development-issues)
12. [Contributing Guidelines](#12-contributing-guidelines)

---

## 1. Architecture Overview

### 1.1 System Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│                    CLIENT LAYER (Browser)                        │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  React Application (Single-Page App)                       │ │
│  │  - Vite Build Tool                                         │ │
│  │  - TypeScript 5.x                                          │ │
│  │  - Tailwind CSS 3.x                                        │ │
│  │  - React Context API (State Management)                   │ │
│  │  - MSAL Browser (Azure AD Authentication)                 │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────────┘
               │ HTTPS REST API Calls
               │ (Authorization: Bearer JWT)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    API LAYER (Backend)                           │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Node.js + Express Server                                  │ │
│  │  - REST API Endpoints (/api/campaigns, /api/events, etc.) │ │
│  │  - JWT Validation Middleware                              │ │
│  │  - RBAC Permission Checking                               │ │
│  │  - SQL Query Builder                                       │ │
│  │  - External API Clients (Brandscopic, QRTiger, etc.)      │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────┬───────────────────────────────────────────────────┘
               │ SQL Queries (Connection Pool)
               ▼
┌──────────────────────────────────────────────────────────────────┐
│                    DATA LAYER (Database)                         │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │  Azure SQL Database                                        │ │
│  │  - Campaigns, Events, Venues                              │ │
│  │  - PeopleAssignments, QRCodes                             │ │
│  │  - Users, Clients, Programs                               │ │
│  │  - Indexes for performance optimization                   │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────┐
│                 EXTERNAL SERVICES                                │
│  - Azure AD (Authentication, User Profiles)                      │
│  - Brandscopic API (Event Sync)                                  │
│  - QRTiger API (QR Code Generation)                              │
│  - Placer.ai API (Venue Footfall Analytics)                      │
│  - Google Maps API (Geolocation, Geocoding, Distance)            │
│  - Smartsheet API (Data Export)                                  │
└──────────────────────────────────────────────────────────────────┘
```

### 1.2 Technology Stack

**Frontend**:
- **Framework**: React 18.2.0 (Functional components with hooks)
- **Language**: TypeScript 5.4.5 (Strict mode enabled)
- **Build Tool**: Vite 5.2.11 (Fast HMR, optimized production builds)
- **Styling**: Tailwind CSS 3.4.1 (Utility-first CSS framework)
- **State Management**: React Context API (8 context providers)
- **Authentication**: MSAL Browser 3.10.0 (Azure AD integration)
- **HTTP Client**: Fetch API (native browser support)
- **Routing**: Section-based navigation (no React Router)

**Backend**:
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express 4.18.2
- **Language**: TypeScript (for type safety in shared types.ts)
- **Database Client**: `mssql` 10.0.1 (Microsoft SQL Server driver)
- **Authentication**: `jsonwebtoken` 9.0.2, `jwks-rsa` 3.1.0
- **Validation**: Custom middleware (input validation, permission checks)

**Database**:
- **Provider**: Azure SQL Database (Managed Service)
- **Version**: SQL Server 2019 or later
- **Migration Tool**: Custom SQL scripts
- **Connection Pooling**: `mssql` package built-in pooling

**Development Tools**:
- **IDE**: VS Code (recommended, with ESLint + Prettier extensions)
- **Version Control**: Git
- **Package Manager**: npm 9+
- **Linting**: ESLint (TypeScript rules)
- **Formatting**: Prettier (automatic code formatting)

### 1.3 Component Hierarchy

```
App.tsx (Root)
  │
  ├─ AuthGuard.tsx (Authentication wrapper)
  │   │
  │   └─ MSAL Provider (Azure AD authentication)
  │
  ├─ Header.tsx (Top navigation, user menu, dark mode toggle)
  │
  ├─ CollapsibleNavigation.tsx (Sidebar navigation)
  │
  └─ Main Content (Conditional rendering based on section)
      │
      ├─ Section: "campaigns"
      │   ├─ CampaignList.tsx (Table/Grid view)
      │   ├─ CampaignDetailView.tsx (Single campaign details)
      │   └─ CampaignModal.tsx (Create/Edit campaign)
      │
      ├─ Section: "events"
      │   ├─ EventCalendar.tsx (Calendar view)
      │   ├─ EventMap.tsx (Map view with Google Maps)
      │   ├─ EventList.tsx (Table view)
      │   ├─ EventDetailView.tsx (Single event details)
      │   └─ EventModal.tsx (Create/Edit event)
      │
      ├─ Section: "venues"
      │   ├─ VenueList.tsx (Search/Filter venues)
      │   ├─ VenueDetailView.tsx (Venue details + events)
      │   └─ VenueModal.tsx (Create/Edit venue)
      │
      ├─ Section: "assignments"
      │   ├─ AssignmentByEvent.tsx (Team roster per event)
      │   ├─ AssignmentByPerson.tsx (Schedule per person)
      │   └─ AssignmentModal.tsx (Create/Edit assignment)
      │
      ├─ Section: "integrations"
      │   ├─ BrandscopicSync.tsx
      │   ├─ QRCodeManager.tsx
      │   └─ PlacerAISettings.tsx
      │
      ├─ Section: "analytics"
      │   ├─ PowerBIDashboard.tsx (Embedded Power BI)
      │   └─ ReportExport.tsx (Export reports)
      │
      └─ Section: "admin"
          ├─ UserManagement.tsx
          ├─ ClientManagement.tsx
          └─ ProgramManagement.tsx
```

### 1.4 Data Flow Diagram

```
┌─────────────┐
│   User      │
│  (Browser)  │
└──────┬──────┘
       │ 1. User logs in via Azure AD
       ▼
┌─────────────────────────────┐
│  MSAL Browser (AuthGuard)   │
│  - Redirect to Azure AD     │
│  - Receive JWT token        │
│  - Store token in session   │
└──────┬──────────────────────┘
       │ 2. User navigates to Campaigns page
       ▼
┌────────────────────────────────┐
│  CampaignContext Provider      │
│  - Fetch campaigns from API    │
│  - Store in React state        │
└──────┬─────────────────────────┘
       │ 3. API call with JWT token
       ▼
┌────────────────────────────────────────┐
│  Backend: GET /api/campaigns           │
│  - Validate JWT (auth middleware)      │
│  - Check permissions (CAMPAIGN_READ)   │
│  - Filter by user's client access      │
│  - Query database                      │
│  - Return JSON response                │
└──────┬─────────────────────────────────┘
       │ 4. SQL query
       ▼
┌────────────────────────────────────────┐
│  Azure SQL Database                    │
│  SELECT * FROM Campaigns               │
│  WHERE client IN (user's clients)      │
└──────┬─────────────────────────────────┘
       │ 5. Result set
       ▼
┌────────────────────────────────────────┐
│  Backend: Format response              │
│  {                                     │
│    data: [...campaigns],               │
│    pagination: {...}                   │
│  }                                     │
└──────┬─────────────────────────────────┘
       │ 6. JSON response
       ▼
┌────────────────────────────────────────┐
│  CampaignContext: Update state         │
│  setCampaigns(response.data)           │
└──────┬─────────────────────────────────┘
       │ 7. React re-renders
       ▼
┌────────────────────────────────────────┐
│  CampaignList.tsx                      │
│  - Displays campaigns in table/grid    │
│  - User can edit, delete, view details │
└────────────────────────────────────────┘
```

---

## 2. Development Environment Setup

### 2.1 Prerequisites

**Required Software**:
- **Node.js 18+ LTS**: Download from https://nodejs.org/
  - Verify: `node --version` (should output `v18.x.x` or higher)
- **npm 9+**: Included with Node.js
  - Verify: `npm --version` (should output `9.x.x` or higher)
- **Git**: Download from https://git-scm.com/
  - Verify: `git --version`
- **VS Code** (Recommended IDE): Download from https://code.visualstudio.com/

**VS Code Extensions** (Recommended):
- ESLint (dbaeumer.vscode-eslint)
- Prettier - Code formatter (esbenp.prettier-vscode)
- TypeScript and JavaScript Language Features (built-in)
- Tailwind CSS IntelliSense (bradlc.vscode-tailwindcss)

### 2.2 Clone Repository

```bash
# Clone the repository
git clone https://github.com/your-org/uxp.git
cd uxp

# Create a new branch for your feature
git checkout -b feature/my-new-feature
```

### 2.3 Install Dependencies

**Frontend Dependencies**:
```bash
# In project root
npm install
```

**Backend Dependencies**:
```bash
# In backend directory
cd backend
npm install
cd ..
```

**Key Dependencies** (auto-installed):

Frontend:
- `react` 18.2.0
- `react-dom` 18.2.0
- `typescript` 5.4.5
- `vite` 5.2.11
- `tailwindcss` 3.4.1
- `@azure/msal-browser` 3.10.0
- `@azure/msal-react` 2.0.12

Backend:
- `express` 4.18.2
- `mssql` 10.0.1
- `jsonwebtoken` 9.0.2
- `jwks-rsa` 3.1.0
- `cors` 2.8.5
- `dotenv` 16.4.5

### 2.4 Environment Variables

**Frontend** (`/home/user/UXP/.env.local`):

```env
# Azure AD Authentication
VITE_AZURE_CLIENT_ID=your-azure-ad-client-id
VITE_AZURE_TENANT_ID=your-azure-ad-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173

# Backend API
VITE_API_BASE_URL=http://localhost:8080/api

# Google Maps API
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Feature Flags
VITE_ENABLE_PLACER_AI=true
VITE_ENABLE_BRANDSCOPIC=true
VITE_ENABLE_QRTIGER=true
```

**Backend** (`/home/user/UXP/backend/.env`):

```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database Connection (Azure SQL or Local SQL Server)
DB_SERVER=localhost
DB_DATABASE=uxp_dev
DB_USER=sa
DB_PASSWORD=YourDevPassword123
DB_PORT=1433
DB_ENCRYPT=false  # Set to true for Azure SQL

# Azure AD Authentication
AZURE_TENANT_ID=your-azure-ad-tenant-id
AZURE_CLIENT_ID=your-azure-ad-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REQUIRED_GROUP_ID=your-dev-group-id

# External API Keys (optional for local dev)
BRANDSCOPIC_API_KEY=optional
QRTIGER_API_KEY=optional
PLACER_AI_API_KEY=optional
GOOGLE_MAPS_API_KEY=optional
```

### 2.5 Running Dev Server

**Terminal 1: Start Backend**:
```bash
cd /home/user/UXP/backend
npm run dev
```

Expected output:
```
[nodemon] starting `node server.js`
✓ Connected to database: uxp_dev
✓ Server running on port 8080
```

**Terminal 2: Start Frontend**:
```bash
cd /home/user/UXP
npm run dev
```

Expected output:
```
VITE v5.2.11  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

**Open Browser**: Navigate to `http://localhost:5173`

### 2.6 Database Connection (Local vs Cloud)

**Option 1: Local SQL Server** (for development):

Install SQL Server 2019 Express or use Docker:

```bash
# Using Docker
docker run -e "ACCEPT_EULA=Y" -e "SA_PASSWORD=YourDevPassword123" \
   -p 1433:1433 --name sql1 \
   -d mcr.microsoft.com/mssql/server:2019-latest
```

**Option 2: Azure SQL Database** (shared dev environment):

Use shared dev database (credentials from admin):

```env
DB_SERVER=uxp-dev-sql.database.windows.net
DB_DATABASE=uxp_dev
DB_USER=dev_user
DB_PASSWORD=shared-dev-password
DB_ENCRYPT=true
```

**Run Migrations**:

```bash
cd backend
npm run migrate
```

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
/home/user/UXP/
│
├── components/              # React components (131 files)
│   ├── admin/              # Admin section components
│   │   ├── UserManagement.tsx
│   │   ├── ClientManagement.tsx
│   │   └── ProgramManagement.tsx
│   ├── tour/               # Onboarding tour components
│   │   ├── TourWelcomeModal.tsx
│   │   ├── TourStep.tsx
│   │   └── TourController.tsx
│   ├── ui/                 # Reusable UI component library
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   ├── Select.tsx
│   │   ├── Modal.tsx
│   │   ├── Toast.tsx
│   │   ├── Icon.tsx
│   │   └── ... (15+ more)
│   ├── venue/              # Venue-specific components
│   │   ├── VenueSearchAutocomplete.tsx
│   │   └── VenueMap.tsx
│   ├── CollapsibleNavigation.tsx  # Sidebar navigation
│   ├── Header.tsx          # Top header with user menu
│   ├── ErrorBoundary.tsx   # Error handling wrapper
│   └── ... (100+ more components)
│
├── contexts/                # React Context providers
│   ├── AuthContext.tsx     # User authentication state
│   ├── CampaignContext.tsx # Campaign data & CRUD
│   ├── EventContext.tsx    # Event data & CRUD
│   ├── VenueContext.tsx    # Venue data & CRUD
│   ├── AssignmentContext.tsx # Team assignment state
│   ├── ClientContext.tsx   # Client data (admin)
│   ├── ProgramContext.tsx  # Program data (admin)
│   └── TourContext.tsx     # Tour state
│
├── services/                # API service layer
│   ├── apiService.ts       # Generic API client
│   ├── campaignService.ts  # Campaign CRUD API calls
│   ├── eventService.ts     # Event CRUD API calls
│   ├── venueService.ts     # Venue CRUD API calls
│   ├── assignmentService.ts # Assignment CRUD API calls
│   ├── brandscopicService.ts # Brandscopic integration
│   ├── qrtigerService.ts   # QRTiger integration
│   └── placerAIService.ts  # Placer.ai integration
│
├── utils/                   # Utility functions
│   ├── dateUtils.ts        # Date formatting, parsing
│   ├── geocodingUtils.ts   # Google Maps geocoding
│   ├── distanceUtils.ts    # Distance calculations
│   ├── validationUtils.ts  # Form validation helpers
│   └── exportUtils.ts      # CSV/PDF export functions
│
├── auth/                    # Authentication module
│   ├── authConfig.ts       # MSAL configuration
│   ├── AuthGuard.tsx       # Authentication wrapper
│   ├── AccessDenied.tsx    # Access denied page
│   └── SignInPage.tsx      # Sign-in UI
│
├── types.ts                 # TypeScript interfaces (1,238 lines)
├── App.tsx                  # Main app component
├── main.tsx                 # React DOM entry point
├── index.html               # HTML template
├── vite.config.ts           # Vite build configuration
├── tailwind.config.js       # Tailwind CSS configuration
├── tsconfig.json            # TypeScript configuration
├── package.json             # Dependencies & scripts
└── .env.local               # Environment variables (not in git)
```

### 3.2 Component Patterns

**Functional Components with Hooks** (Standard Pattern):

```tsx
// components/CampaignList.tsx
import { useState, useEffect, useContext } from 'react';
import { CampaignContext } from '../contexts/CampaignContext';
import { Campaign } from '../types';
import Button from './ui/Button';
import Card from './ui/Card';

interface CampaignListProps {
  onCampaignClick?: (campaign: Campaign) => void;
}

export default function CampaignList({ onCampaignClick }: CampaignListProps) {
  const { campaigns, loading, error, fetchCampaigns } = useContext(CampaignContext);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  useEffect(() => {
    fetchCampaigns();
  }, []);

  if (loading) return <div>Loading campaigns...</div>;
  if (error) return <div>Error: {error}</div>;

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Campaigns</h1>
        <Button onClick={() => setViewMode(viewMode === 'list' ? 'grid' : 'list')}>
          Toggle View
        </Button>
      </div>

      {viewMode === 'list' ? (
        <table className="w-full">
          {/* Table implementation */}
        </table>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {campaigns.map((campaign) => (
            <Card key={campaign.id} onClick={() => onCampaignClick?.(campaign)}>
              <h3>{campaign.campaignName}</h3>
              <p>{campaign.client}</p>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

### 3.3 State Management

**Context API Pattern** (used for all global state):

```tsx
// contexts/CampaignContext.tsx
import { createContext, useState, ReactNode } from 'react';
import { Campaign } from '../types';
import { campaignService } from '../services/campaignService';

interface CampaignContextType {
  campaigns: Campaign[];
  loading: boolean;
  error: string | null;
  fetchCampaigns: () => Promise<void>;
  createCampaign: (campaign: Partial<Campaign>) => Promise<Campaign>;
  updateCampaign: (id: string, updates: Partial<Campaign>) => Promise<Campaign>;
  deleteCampaign: (id: string) => Promise<void>;
}

export const CampaignContext = createContext<CampaignContextType>({} as CampaignContextType);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaigns = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await campaignService.getAllCampaigns();
      setCampaigns(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createCampaign = async (campaign: Partial<Campaign>) => {
    const newCampaign = await campaignService.createCampaign(campaign);
    setCampaigns([...campaigns, newCampaign]);
    return newCampaign;
  };

  const updateCampaign = async (id: string, updates: Partial<Campaign>) => {
    const updatedCampaign = await campaignService.updateCampaign(id, updates);
    setCampaigns(campaigns.map((c) => (c.id === id ? updatedCampaign : c)));
    return updatedCampaign;
  };

  const deleteCampaign = async (id: string) => {
    await campaignService.deleteCampaign(id);
    setCampaigns(campaigns.filter((c) => c.id !== id));
  };

  return (
    <CampaignContext.Provider
      value={{
        campaigns,
        loading,
        error,
        fetchCampaigns,
        createCampaign,
        updateCampaign,
        deleteCampaign,
      }}
    >
      {children}
    </CampaignContext.Provider>
  );
}
```

**Using Context in Components**:

```tsx
// In App.tsx
import { CampaignProvider } from './contexts/CampaignContext';

function App() {
  return (
    <CampaignProvider>
      <EventProvider>
        <VenueProvider>
          {/* Your app components */}
        </VenueProvider>
      </EventProvider>
    </CampaignProvider>
  );
}
```

### 3.4 UI Component Library

**Reusable Components** (`/components/ui/`):

**Button.tsx** (multiple variants):
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

export default function Button({
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  children,
  className = '',
}: ButtonProps) {
  const baseClasses = 'font-semibold rounded-md transition-all duration-200 disabled:opacity-50';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-100',
    ghost: 'bg-transparent text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${variants[variant]} ${sizes[size]} ${className}`}
    >
      {children}
    </button>
  );
}
```

**Usage**:
```tsx
<Button variant="primary" size="md" onClick={() => handleSave()}>
  Save Campaign
</Button>
```

### 3.5 Routing (Section-Based Navigation)

**No React Router** - Uses conditional rendering based on `currentSection` state:

```tsx
// App.tsx
import { useState } from 'react';

function App() {
  const [currentSection, setCurrentSection] = useState<string>('campaigns');

  return (
    <div className="app">
      <CollapsibleNavigation
        currentSection={currentSection}
        onSectionChange={setCurrentSection}
      />

      <main className="content">
        {currentSection === 'campaigns' && <CampaignSection />}
        {currentSection === 'events' && <EventSection />}
        {currentSection === 'venues' && <VenueSection />}
        {currentSection === 'assignments' && <AssignmentSection />}
        {currentSection === 'integrations' && <IntegrationSection />}
        {currentSection === 'analytics' && <AnalyticsSection />}
        {currentSection === 'admin' && <AdminSection />}
      </main>
    </div>
  );
}
```

### 3.6 TypeScript Best Practices

**Strict Mode Enabled** (`tsconfig.json`):

```json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictPropertyInitialization": true
  }
}
```

**Interface Definitions** (always define types):

```tsx
// types.ts
export interface Campaign {
  id: string;
  campaignName: string;
  campaignDescription?: string;
  client: string;
  eventType: string;
  region: string;
  status: "planning" | "active" | "completed" | "cancelled";
  year: number;
  month: number;
  campaignOwner: string;
  campaignOwnerEmail: string;
  createdBy: string;
  createdOn: Date;
  updatedBy?: string;
  updatedOn?: Date;
  jobNumbers: string[];
  visible: boolean;
}
```

**No `any` Types** (use `unknown` if type is truly unknown):

```tsx
// ❌ BAD
function handleData(data: any) {
  console.log(data.name);
}

// ✅ GOOD
function handleData(data: Campaign | Event) {
  if ('campaignName' in data) {
    console.log(data.campaignName);
  }
}
```

---

## 4. Backend Architecture

### 4.1 Project Structure

```
/home/user/UXP/backend/
│
├── routes/                  # API route handlers
│   ├── campaigns.ts        # Campaign CRUD endpoints
│   ├── events.ts           # Event CRUD endpoints
│   ├── venues.ts           # Venue CRUD endpoints
│   ├── assignments.ts      # Assignment CRUD endpoints
│   ├── users.ts            # User management endpoints
│   ├── clients.ts          # Client management endpoints
│   ├── programs.ts         # Program management endpoints
│   └── integrations.ts     # Integration endpoints (Brandscopic, QRTiger, etc.)
│
├── middleware/              # Express middleware
│   ├── auth.ts             # JWT validation, group check
│   ├── permissions.ts      # RBAC permission checking
│   ├── validation.ts       # Input validation
│   └── errorHandler.ts     # Global error handling
│
├── database/                # Database layer
│   ├── migrations/         # SQL migration scripts
│   │   ├── 100_uxp_core.sql
│   │   ├── 110_add_budget_fields.sql
│   │   └── ...
│   ├── connection.ts       # Database connection pool
│   ├── queryBuilder.ts     # SQL query builder
│   └── migrate.js          # Migration runner script
│
├── config/                  # Configuration files
│   ├── database.ts         # Database config
│   ├── auth.ts             # Azure AD config
│   └── integrations.ts     # External API config
│
├── services/                # External API clients
│   ├── brandscopicClient.ts
│   ├── qrtigerClient.ts
│   ├── placerAIClient.ts
│   └── smartsheetClient.ts
│
├── utils/                   # Utility functions
│   ├── logger.ts           # Logging utility
│   ├── geocoding.ts        # Google Maps geocoding
│   └── distance.ts         # Distance calculations
│
├── server.ts                # Express app entry point
├── package.json             # Dependencies & scripts
├── tsconfig.json            # TypeScript configuration
└── .env                     # Environment variables (not in git)
```

### 4.2 API Design (RESTful Conventions)

**Endpoint Structure**:

```
GET    /api/campaigns          - List/Query campaigns
POST   /api/campaigns          - Create campaign
GET    /api/campaigns/:id      - Read single campaign
PUT    /api/campaigns/:id      - Update campaign
DELETE /api/campaigns/:id      - Delete campaign
```

**Request/Response Formats**:

**List Endpoint** (with pagination):
```json
GET /api/campaigns?page=1&limit=50&client=AMEX&status=active

Response:
{
  "data": [
    {
      "id": "campaign-123",
      "campaignName": "AMEX Music Activation 2025",
      "client": "AMEX",
      "status": "active",
      ...
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 123,
    "totalPages": 3
  }
}
```

**Create Endpoint**:
```json
POST /api/campaigns
Content-Type: application/json
Authorization: Bearer JWT_TOKEN

Request Body:
{
  "campaignName": "New Campaign",
  "client": "AMEX",
  "eventType": "Sports Activation",
  "region": "Northeast",
  "year": 2025,
  "month": 6,
  "campaignOwner": "John Doe",
  "campaignOwnerEmail": "john.doe@company.com",
  "status": "planning"
}

Response: 201 Created
{
  "id": "campaign-124",
  "campaignName": "New Campaign",
  ...
  "createdBy": "current-user-id",
  "createdOn": "2025-11-22T10:00:00Z"
}
```

**Error Responses**:

```json
400 Bad Request (Validation Error):
{
  "error": "Validation failed",
  "details": {
    "campaignName": "Campaign name is required",
    "year": "Year must be between 2020 and 2030"
  }
}

401 Unauthorized:
{
  "error": "Unauthorized",
  "message": "No token provided or token is invalid"
}

403 Forbidden:
{
  "error": "Forbidden",
  "message": "Insufficient permissions"
}

404 Not Found:
{
  "error": "Not found",
  "message": "Campaign with ID campaign-999 not found"
}

500 Internal Server Error:
{
  "error": "Internal server error",
  "message": "An unexpected error occurred"
}
```

### 4.3 Database Access

**Connection Pooling** (`database/connection.ts`):

```typescript
import sql from 'mssql';

const config: sql.config = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_DATABASE!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  port: parseInt(process.env.DB_PORT || '1433'),
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.NODE_ENV === 'development',
  },
};

let pool: sql.ConnectionPool | null = null;

export async function getPool(): Promise<sql.ConnectionPool> {
  if (!pool) {
    pool = await sql.connect(config);
    console.log('✓ Connected to database:', config.database);
  }
  return pool;
}
```

**SQL Query Builder** (`database/queryBuilder.ts`):

```typescript
import { getPool } from './connection';
import sql from 'mssql';

export async function getCampaigns(filters: {
  client?: string;
  status?: string;
  year?: number;
  page?: number;
  limit?: number;
}) {
  const pool = await getPool();
  const { client, status, year, page = 1, limit = 50 } = filters;

  let query = `
    SELECT * FROM Campaigns
    WHERE 1=1
  `;
  const params: any = {};

  if (client) {
    query += ` AND client = @client`;
    params.client = client;
  }
  if (status) {
    query += ` AND status = @status`;
    params.status = status;
  }
  if (year) {
    query += ` AND year = @year`;
    params.year = year;
  }

  query += ` ORDER BY createdOn DESC`;
  query += ` OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`;
  params.offset = (page - 1) * limit;
  params.limit = limit;

  const request = pool.request();
  Object.keys(params).forEach((key) => {
    request.input(key, params[key]);
  });

  const result = await request.query(query);
  return result.recordset;
}
```

**Transaction Handling** (for multi-step operations):

```typescript
export async function createCampaignWithEvents(campaignData: any, eventsData: any[]) {
  const pool = await getPool();
  const transaction = new sql.Transaction(pool);

  try {
    await transaction.begin();

    // Insert campaign
    const campaignResult = await transaction.request()
      .input('campaignName', campaignData.campaignName)
      .input('client', campaignData.client)
      .query('INSERT INTO Campaigns (...) OUTPUT INSERTED.id VALUES (...)');

    const campaignId = campaignResult.recordset[0].id;

    // Insert events
    for (const event of eventsData) {
      await transaction.request()
        .input('campaignId', campaignId)
        .input('eventName', event.eventName)
        .query('INSERT INTO Events (...) VALUES (...)');
    }

    await transaction.commit();
    return { campaignId };
  } catch (err) {
    await transaction.rollback();
    throw err;
  }
}
```

### 4.4 Authentication Middleware

**JWT Validation** (`middleware/auth.ts`):

```typescript
import jwt from 'jsonwebtoken';
import jwksClient from 'jwks-rsa';
import { Request, Response, NextFunction } from 'express';

const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/discovery/v2.0/keys`,
});

function getKey(header: any, callback: any) {
  client.getSigningKey(header.kid, (err, key) => {
    const signingKey = key?.getPublicKey();
    callback(null, signingKey);
  });
}

export async function validateJWT(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  const token = authHeader.substring(7);

  try {
    const decoded = await new Promise<any>((resolve, reject) => {
      jwt.verify(token, getKey, {
        audience: process.env.AZURE_CLIENT_ID,
        issuer: `https://login.microsoftonline.com/${process.env.AZURE_TENANT_ID}/v2.0`,
      }, (err, decoded) => {
        if (err) reject(err);
        else resolve(decoded);
      });
    });

    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}

export function requireGroup(groupId: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    const userGroups = req.user?.groups || [];
    if (!userGroups.includes(groupId)) {
      return res.status(403).json({ error: 'Forbidden: User not in required group' });
    }
    next();
  };
}
```

**Usage in Routes**:

```typescript
import { validateJWT, requireGroup } from '../middleware/auth';

const router = express.Router();

// All routes require authentication
router.use(validateJWT);

// All routes require group membership
router.use(requireGroup(process.env.AZURE_REQUIRED_GROUP_ID!));

router.get('/campaigns', getCampaigns);
router.post('/campaigns', createCampaign);
```

### 4.5 External API Clients

**Brandscopic Client** (`services/brandscopicClient.ts`):

```typescript
export async function syncEventToBrandscopic(event: Event) {
  const response = await fetch('https://api.brandscopic.com/v1/events', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${process.env.BRANDSCOPIC_API_KEY}`,
      'Content-Type': 'application/json',
      'X-Tenant-ID': process.env.BRANDSCOPIC_TENANT_ID!,
    },
    body: JSON.stringify({
      name: event.eventName,
      start_date: event.eventStartDate,
      end_date: event.eventEndDate,
      venue: {
        name: event.eventVenue,
        address: event.address1,
        city: event.city,
        country: event.country,
        latitude: event.latitude,
        longitude: event.longitude,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(`Brandscopic sync failed: ${error.message}`);
  }

  return await response.json();
}
```

---

## 5. Data Model

### 5.1 Core Entities

**Campaign** (23 fields):
```typescript
export interface Campaign {
  id: string;
  campaignName: string;
  campaignDescription?: string;
  campaignNotes?: string;
  client: string;
  eventType: string;
  masterProgram?: string;
  region: string;
  status: "planning" | "active" | "completed" | "cancelled";
  year: number;
  month: number;
  yearMonth: string;
  campaignOwner: string;
  campaignOwnerEmail: string;
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;
  jobNumbers: string[];
  visible: boolean;
}
```

**Event** (34 fields):
```typescript
export interface Event {
  id: string;
  campaignId: string;
  eventName: string;
  eventDetails?: string;
  eventNotes?: string;
  number?: string;
  index?: number;
  eventStartDate: Date;
  eventEndDate: Date;
  year: number;
  month: number;
  yearMonthStart: string;
  yearMonthEnd: string;
  eventVenue?: string;
  city: string;
  country: string;
  postCode?: string;
  address1?: string;
  address2?: string;
  latitude?: number;
  longitude?: number;
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;
  owner: string;
  ownerName: string;
  status: "planning" | "active" | "completed" | "cancelled";
  createdBy: string;
  createdByName: string;
  createdOn: Date;
  updatedBy?: string;
  updatedByName?: string;
  updatedOn?: Date;
}
```

**Venue** (27 fields):
```typescript
export interface Venue {
  id: string;
  eventId?: string;
  name: string;
  fullAddress?: string;
  formattedAddress?: string;
  country: string;
  city: string;
  state?: string;
  stateCode?: string;
  postCode?: string;
  address?: string;
  number?: string;
  latitude?: number;
  longitude?: number;
  geoJSONData?: string;
  platform?: string;
  poiScope?: string;
  entityType?: string;
  category?: string;
  group?: string;
  subCategory?: string;
  status?: string;
  sentOn?: Date;
  checkedOn?: Date;
  count?: number;
  tags: string[];
  url?: string;
}
```

**PeopleAssignment** (17 fields):
```typescript
export interface PeopleAssignment {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userEmail: string;
  userDepartment?: string;
  userRole: string;
  onSite: boolean;
  distanceFromOfficeMi?: number;
  distanceFromOfficeKm?: number;
  timeFromOfficeMins?: number;
  managerName?: string;
  managerEmail?: string;
  managerRole?: string;
  assignedByName: string;
  assignedByEmail: string;
  assignedOn: Date;
}
```

**QRCode** (9 fields):
```typescript
export interface QRCode {
  id: string;
  eventId: string;
  codeData: string;
  generatedOn: Date;
  scanCount: number;
  qrtigerId?: string;
  qrtigerLastSync?: Date;
  qrtigerPath?: string;
  qrtigerStatus?: string;
}
```

### 5.2 Relationships

```
Clients (1) ────► (N) Campaigns (1) ────► (N) Events (1) ────► (N) PeopleAssignments
                        │                        │
                        │                        └────► (N) QRCodes
                        │
                        └────► (N) Programs
```

**Foreign Key Constraints**:
- `Events.campaignId` → `Campaigns.id`
- `Venues.eventId` → `Events.id` (optional, venues can exist independently)
- `PeopleAssignments.eventId` → `Events.id`
- `QRCodes.eventId` → `Events.id`

### 5.3 Database Schema

**Migrations File** (`/backend/database/migrations/100_uxp_core.sql`):

```sql
-- Campaigns Table
CREATE TABLE Campaigns (
  id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
  campaignName NVARCHAR(255) NOT NULL,
  campaignDescription NVARCHAR(MAX),
  campaignNotes NVARCHAR(MAX),
  client NVARCHAR(100) NOT NULL,
  eventType NVARCHAR(100) NOT NULL,
  masterProgram NVARCHAR(100),
  region NVARCHAR(100) NOT NULL,
  status NVARCHAR(20) DEFAULT 'planning',
  year INT NOT NULL,
  month INT NOT NULL,
  yearMonth NVARCHAR(7) NOT NULL,
  campaignOwner NVARCHAR(255) NOT NULL,
  campaignOwnerEmail NVARCHAR(255) NOT NULL,
  createdBy NVARCHAR(255) NOT NULL,
  createdByName NVARCHAR(255) NOT NULL,
  createdOn DATETIME DEFAULT GETDATE(),
  updatedBy NVARCHAR(255),
  updatedByName NVARCHAR(255),
  updatedOn DATETIME,
  jobNumbers NVARCHAR(MAX),  -- JSON array
  visible BIT DEFAULT 1,
  CONSTRAINT chk_status CHECK (status IN ('planning', 'active', 'completed', 'cancelled'))
);

CREATE INDEX idx_campaigns_client ON Campaigns(client);
CREATE INDEX idx_campaigns_year ON Campaigns(year);
CREATE INDEX idx_campaigns_status ON Campaigns(status);

-- Events Table
CREATE TABLE Events (
  id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
  campaignId NVARCHAR(50) NOT NULL,
  eventName NVARCHAR(255) NOT NULL,
  eventDetails NVARCHAR(MAX),
  eventNotes NVARCHAR(MAX),
  number NVARCHAR(50),
  [index] INT,
  eventStartDate DATETIME NOT NULL,
  eventEndDate DATETIME NOT NULL,
  year INT NOT NULL,
  month INT NOT NULL,
  yearMonthStart NVARCHAR(7) NOT NULL,
  yearMonthEnd NVARCHAR(7) NOT NULL,
  eventVenue NVARCHAR(255),
  city NVARCHAR(100) NOT NULL,
  country NVARCHAR(100) NOT NULL,
  postCode NVARCHAR(20),
  address1 NVARCHAR(255),
  address2 NVARCHAR(255),
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  distanceFromOfficeMi DECIMAL(10, 2),
  distanceFromOfficeKm DECIMAL(10, 2),
  timeFromOfficeMins INT,
  owner NVARCHAR(255) NOT NULL,
  ownerName NVARCHAR(255) NOT NULL,
  status NVARCHAR(20) DEFAULT 'planning',
  createdBy NVARCHAR(255) NOT NULL,
  createdByName NVARCHAR(255) NOT NULL,
  createdOn DATETIME DEFAULT GETDATE(),
  updatedBy NVARCHAR(255),
  updatedByName NVARCHAR(255),
  updatedOn DATETIME,
  FOREIGN KEY (campaignId) REFERENCES Campaigns(id) ON DELETE CASCADE,
  CONSTRAINT chk_event_status CHECK (status IN ('planning', 'active', 'completed', 'cancelled'))
);

CREATE INDEX idx_events_campaignId ON Events(campaignId);
CREATE INDEX idx_events_city ON Events(city);
CREATE INDEX idx_events_startDate ON Events(eventStartDate);
```

---

## 6. Adding New Features

### 6.1 Step-by-Step Guide

**Example**: Adding a "Campaign Budget" feature

**Step 1: Define TypeScript Interface** (`types.ts`):

```typescript
// Update Campaign interface
export interface Campaign {
  id: string;
  campaignName: string;
  // ... existing fields ...

  // NEW: Budget fields
  budgetPlanned?: number;
  budgetActual?: number;
  budgetCurrency?: string;  // USD, EUR, GBP, etc.
}
```

**Step 2: Create Database Migration** (`backend/database/migrations/110_add_budget_fields.sql`):

```sql
ALTER TABLE Campaigns
ADD budgetPlanned DECIMAL(15, 2),
    budgetActual DECIMAL(15, 2),
    budgetCurrency NVARCHAR(3) DEFAULT 'USD';
```

Run migration:
```bash
cd backend
npm run migrate
```

**Step 3: Build Backend API Endpoints** (`backend/routes/campaigns.ts`):

```typescript
// Add budget fields to update endpoint
router.put('/campaigns/:id', validateJWT, requirePermission('CAMPAIGN_UPDATE'), async (req, res) => {
  const { id } = req.params;
  const { budgetPlanned, budgetActual, budgetCurrency, ...otherFields } = req.body;

  const pool = await getPool();
  await pool.request()
    .input('id', id)
    .input('budgetPlanned', budgetPlanned)
    .input('budgetActual', budgetActual)
    .input('budgetCurrency', budgetCurrency)
    .query(`
      UPDATE Campaigns
      SET budgetPlanned = @budgetPlanned,
          budgetActual = @budgetActual,
          budgetCurrency = @budgetCurrency
      WHERE id = @id
    `);

  res.json({ message: 'Budget updated successfully' });
});
```

**Step 4: Update Context Provider** (`contexts/CampaignContext.tsx`):

```typescript
// Add new function
const updateCampaignBudget = async (id: string, budget: {
  budgetPlanned?: number;
  budgetActual?: number;
  budgetCurrency?: string;
}) => {
  await campaignService.updateCampaignBudget(id, budget);
  // Update local state
  setCampaigns(campaigns.map(c => c.id === id ? { ...c, ...budget } : c));
};
```

**Step 5: Build React Components**:

**BudgetModal.tsx**:
```tsx
interface BudgetModalProps {
  campaign: Campaign;
  onSave: (budget: { budgetPlanned: number; budgetActual: number; budgetCurrency: string }) => void;
  onClose: () => void;
}

export default function BudgetModal({ campaign, onSave, onClose }: BudgetModalProps) {
  const [budgetPlanned, setBudgetPlanned] = useState(campaign.budgetPlanned || 0);
  const [budgetActual, setBudgetActual] = useState(campaign.budgetActual || 0);
  const [budgetCurrency, setBudgetCurrency] = useState(campaign.budgetCurrency || 'USD');

  const handleSave = () => {
    onSave({ budgetPlanned, budgetActual, budgetCurrency });
    onClose();
  };

  return (
    <Modal onClose={onClose}>
      <h2 className="text-xl font-bold mb-4">Manage Campaign Budget</h2>

      <Input
        label="Planned Budget"
        type="number"
        value={budgetPlanned}
        onChange={(e) => setBudgetPlanned(parseFloat(e.target.value))}
      />

      <Input
        label="Actual Budget"
        type="number"
        value={budgetActual}
        onChange={(e) => setBudgetActual(parseFloat(e.target.value))}
      />

      <Select
        label="Currency"
        value={budgetCurrency}
        onChange={(e) => setBudgetCurrency(e.target.value)}
        options={[
          { value: 'USD', label: 'USD ($)' },
          { value: 'EUR', label: 'EUR (€)' },
          { value: 'GBP', label: 'GBP (£)' },
        ]}
      />

      <div className="flex justify-end gap-2 mt-4">
        <Button variant="secondary" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={handleSave}>Save Budget</Button>
      </div>
    </Modal>
  );
}
```

**Step 6: Add to Navigation/UI**:

**CampaignDetailView.tsx**:
```tsx
import BudgetModal from './BudgetModal';

export default function CampaignDetailView({ campaign }: { campaign: Campaign }) {
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const { updateCampaignBudget } = useContext(CampaignContext);

  const handleSaveBudget = async (budget: any) => {
    await updateCampaignBudget(campaign.id, budget);
  };

  return (
    <div>
      {/* ... existing campaign details ... */}

      <Card>
        <h3 className="text-lg font-bold">Budget</h3>
        <p>Planned: ${campaign.budgetPlanned || 0}</p>
        <p>Actual: ${campaign.budgetActual || 0}</p>
        <Button onClick={() => setShowBudgetModal(true)}>Edit Budget</Button>
      </Card>

      {showBudgetModal && (
        <BudgetModal
          campaign={campaign}
          onSave={handleSaveBudget}
          onClose={() => setShowBudgetModal(false)}
        />
      )}
    </div>
  );
}
```

**Step 7: Test Thoroughly**:
- ✅ Create campaign and set budget
- ✅ Update budget values
- ✅ View budget in campaign detail
- ✅ Export campaign with budget (CSV/PDF)
- ✅ Test with different currencies
- ✅ Test permission checks (only admins/account managers can edit budget)

---

## 7. Testing Strategy

### 7.1 Unit Testing (Not Currently Implemented)

**Recommended**: Jest + React Testing Library

**Install Dependencies**:
```bash
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @types/jest
```

**Example Test** (`__tests__/CampaignList.test.tsx`):
```tsx
import { render, screen, waitFor } from '@testing-library/react';
import CampaignList from '../components/CampaignList';
import { CampaignContext } from '../contexts/CampaignContext';

describe('CampaignList', () => {
  it('renders loading state', () => {
    const mockContext = {
      campaigns: [],
      loading: true,
      error: null,
      fetchCampaigns: jest.fn(),
    };

    render(
      <CampaignContext.Provider value={mockContext}>
        <CampaignList />
      </CampaignContext.Provider>
    );

    expect(screen.getByText('Loading campaigns...')).toBeInTheDocument();
  });

  it('renders campaigns after loading', async () => {
    const mockContext = {
      campaigns: [
        { id: '1', campaignName: 'Test Campaign', client: 'AMEX', status: 'active' },
      ],
      loading: false,
      error: null,
      fetchCampaigns: jest.fn(),
    };

    render(
      <CampaignContext.Provider value={mockContext}>
        <CampaignList />
      </CampaignContext.Provider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Campaign')).toBeInTheDocument();
    });
  });
});
```

**Run Tests**:
```bash
npm test
```

### 7.2 Integration Testing

**API Endpoint Testing** (using Supertest):

```typescript
// __tests__/api/campaigns.test.ts
import request from 'supertest';
import app from '../server';

describe('Campaigns API', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get JWT token
    const response = await request(app)
      .post('/api/auth/login')
      .send({ username: 'test', password: 'password' });
    authToken = response.body.token;
  });

  it('GET /api/campaigns returns campaigns', async () => {
    const response = await request(app)
      .get('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toBeInstanceOf(Array);
  });

  it('POST /api/campaigns creates campaign', async () => {
    const response = await request(app)
      .post('/api/campaigns')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        campaignName: 'Test Campaign',
        client: 'AMEX',
        eventType: 'Music Festival',
        region: 'Northeast',
        year: 2025,
        month: 6,
        status: 'planning',
      });

    expect(response.status).toBe(201);
    expect(response.body.campaignName).toBe('Test Campaign');
  });
});
```

### 7.3 End-to-End Testing

**Recommended**: Playwright

**Install**:
```bash
npm install --save-dev @playwright/test
```

**Example E2E Test** (`e2e/campaign-flow.spec.ts`):
```typescript
import { test, expect } from '@playwright/test';

test('create campaign end-to-end', async ({ page }) => {
  // Navigate to app
  await page.goto('http://localhost:5173');

  // Login
  await page.click('text=Sign in with Microsoft');
  await page.fill('input[name="email"]', 'test@company.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');

  // Wait for dashboard
  await page.waitForSelector('text=Campaigns');

  // Navigate to Campaigns section
  await page.click('text=Campaigns');

  // Create new campaign
  await page.click('text=+ Create Campaign');
  await page.fill('input[name="campaignName"]', 'Test Campaign');
  await page.selectOption('select[name="client"]', 'AMEX');
  await page.fill('input[name="year"]', '2025');
  await page.click('button:has-text("Create Campaign")');

  // Verify campaign appears in list
  await expect(page.locator('text=Test Campaign')).toBeVisible();
});
```

**Run E2E Tests**:
```bash
npx playwright test
```

### 7.4 Manual Testing Checklist

**CRUD Operations** (for all entities):
- ✅ Create: Campaign, Event, Venue, Assignment
- ✅ Read: List view, detail view, search, filter
- ✅ Update: Edit modal, save changes
- ✅ Delete: Delete button, confirmation modal

**Dark Mode**:
- ✅ Toggle dark mode (all pages render correctly)
- ✅ All components support dark mode classes

**Responsive Design** (3 breakpoints):
- ✅ Desktop (1440px): Full layout
- ✅ Tablet (768px): Collapsed navigation, grid layout
- ✅ Mobile (375px): Single column, stacked components

**Browser Compatibility**:
- ✅ Chrome (latest)
- ✅ Firefox (latest)
- ✅ Safari (latest)
- ✅ Edge (latest)

---

## 8. Deployment

### 8.1 Build Process

**Build Frontend**:
```bash
cd /home/user/UXP
npm run build
```

Output: `/dist` folder with optimized static files

**TypeScript Compilation**: Automatic (Vite handles TypeScript)

**Vite Bundling**:
- Code splitting
- Tree shaking (removes unused code)
- Minification
- Asset optimization (images, fonts)

### 8.2 Environment-Specific Configuration

**Development** (`.env.local`):
```env
VITE_API_BASE_URL=http://localhost:8080/api
VITE_AZURE_REDIRECT_URI=http://localhost:5173
```

**Production** (`.env.production`):
```env
VITE_API_BASE_URL=https://api.uxp.company.com/api
VITE_AZURE_REDIRECT_URI=https://uxp.company.com
```

### 8.3 Deploying to Google Cloud Run

**Dockerfile** (`/home/user/UXP/Dockerfile`):
```dockerfile
# Stage 1: Build
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Stage 2: Serve
FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
```

**Deploy**:
```bash
# Build and push Docker image
gcloud builds submit --tag gcr.io/your-project/uxp-frontend:latest

# Deploy to Cloud Run
gcloud run deploy uxp-frontend \
  --image gcr.io/your-project/uxp-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="VITE_API_BASE_URL=https://api.uxp.company.com/api,VITE_AZURE_REDIRECT_URI=https://uxp.company.com"
```

### 8.4 Database Migrations in Production

**Before Deployment**:
```bash
# Connect to production database
DB_SERVER=uxp-prod-sql.database.windows.net \
DB_DATABASE=uxp_prod \
DB_USER=prod_user \
DB_PASSWORD=prod_password \
npm run migrate
```

**Rollback Strategy**:
- Keep rollback SQL scripts: `110_add_budget_fields_rollback.sql`
- Test migrations in staging environment first
- Have database backup before migrations

### 8.5 Monitoring Deployment

**Cloud Run Logs**:
```bash
gcloud logging read "resource.type=cloud_run_revision" --limit 50
```

**Error Tracking**: Set up Cloud Error Reporting or Sentry

**Performance Metrics**: Monitor response times, error rates, CPU/memory usage

---

## 9. Common Tasks

### 9.1 Adding a New Navigation Section

**Step 1: Add section to navigation** (`components/CollapsibleNavigation.tsx`):

```tsx
const sections = [
  { id: 'campaigns', label: 'Campaigns', icon: 'briefcase' },
  { id: 'events', label: 'Events', icon: 'calendar' },
  { id: 'venues', label: 'Venues', icon: 'map-pin' },
  { id: 'assignments', label: 'Assignments', icon: 'users' },
  { id: 'integrations', label: 'Integrations', icon: 'link' },
  { id: 'analytics', label: 'Analytics', icon: 'chart' },
  { id: 'admin', label: 'Admin', icon: 'settings' },
  { id: 'reports', label: 'Reports', icon: 'file-text' },  // NEW
];
```

**Step 2: Add section to App.tsx routing**:

```tsx
{currentSection === 'reports' && <ReportsSection />}
```

**Step 3: Create component** (`components/ReportsSection.tsx`):

```tsx
export default function ReportsSection() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Reports</h1>
      {/* Report UI */}
    </div>
  );
}
```

### 9.2 Creating a New API Endpoint

**Step 1: Add route handler** (`backend/routes/reports.ts`):

```typescript
import express from 'express';
import { validateJWT } from '../middleware/auth';
import { requirePermission } from '../middleware/permissions';

const router = express.Router();

router.get('/reports/campaign-summary', validateJWT, requirePermission('CAMPAIGN_READ'), async (req, res) => {
  // Implementation
  const pool = await getPool();
  const result = await pool.request().query('SELECT * FROM vw_CampaignSummary');
  res.json({ data: result.recordset });
});

export default router;
```

**Step 2: Register routes in server.ts**:

```typescript
import reportsRoutes from './routes/reports';

app.use('/api', reportsRoutes);
```

**Step 3: Document in backend/API_DESIGN.md**:

```markdown
## Reports Endpoints

### Get Campaign Summary Report
GET /api/reports/campaign-summary

**Permission Required**: CAMPAIGN_READ

**Response**: 200 OK
{
  "data": [...]
}
```

### 9.3 Adding a New Database Table

**Step 1: Create migration** (`backend/database/migrations/120_create_reports_table.sql`):

```sql
CREATE TABLE Reports (
  id NVARCHAR(50) PRIMARY KEY DEFAULT NEWID(),
  reportName NVARCHAR(255) NOT NULL,
  reportType NVARCHAR(50) NOT NULL,
  generatedBy NVARCHAR(255) NOT NULL,
  generatedOn DATETIME DEFAULT GETDATE(),
  reportData NVARCHAR(MAX)  -- JSON data
);

CREATE INDEX idx_reports_type ON Reports(reportType);
CREATE INDEX idx_reports_generatedOn ON Reports(generatedOn);
```

**Step 2: Run migration**:
```bash
npm run migrate
```

**Step 3: Update TypeScript interfaces** (`types.ts`):

```typescript
export interface Report {
  id: string;
  reportName: string;
  reportType: string;
  generatedBy: string;
  generatedOn: Date;
  reportData: any;  // Parsed JSON
}
```

**Step 4: Create API endpoints** (see 9.2)

### 9.4 Integrating a New External API

**Step 1: Create service file** (`backend/services/newAPIClient.ts`):

```typescript
export async function fetchDataFromNewAPI(params: any) {
  const response = await fetch('https://api.newservice.com/v1/data', {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${process.env.NEW_API_KEY}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`New API failed: ${response.statusText}`);
  }

  return await response.json();
}
```

**Step 2: Add API key to `.env`**:

```env
NEW_API_KEY=your-new-api-key
```

**Step 3: Test connection**:

```typescript
// backend/routes/integrations.ts
router.get('/integrations/new-api/test', validateJWT, async (req, res) => {
  try {
    const data = await fetchDataFromNewAPI({});
    res.json({ success: true, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});
```

**Step 4: Handle errors gracefully**:

```typescript
try {
  const data = await fetchDataFromNewAPI(params);
  return data;
} catch (err) {
  console.error('New API error:', err);
  // Return fallback data or throw error
  return null;
}
```

---

## 10. Code Style & Best Practices

### 10.1 TypeScript Conventions

**Interface Naming**: PascalCase
```typescript
export interface Campaign { ... }
export interface Event { ... }
```

**Function Naming**: camelCase
```typescript
function getCampaigns() { ... }
function createCampaign(data: Campaign) { ... }
```

**Avoid `any` Types**: Use specific types or `unknown`
```typescript
// ❌ BAD
function processData(data: any) { ... }

// ✅ GOOD
function processData(data: Campaign | Event) { ... }
```

### 10.2 React Conventions

**Functional Components Only** (no class components):
```tsx
// ✅ GOOD
export default function CampaignList() { ... }

// ❌ BAD
export default class CampaignList extends React.Component { ... }
```

**Custom Hooks for Reusable Logic**:
```tsx
// hooks/useLocalStorage.ts
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : initialValue;
  });

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
}
```

**Props Destructuring**:
```tsx
// ✅ GOOD
function Button({ variant, size, onClick, children }: ButtonProps) { ... }

// ❌ BAD
function Button(props: ButtonProps) {
  return <button className={props.variant}>{ props.children}</button>;
}
```

### 10.3 CSS/Tailwind Conventions

**Utility-First Approach** (prefer Tailwind classes over custom CSS):
```tsx
// ✅ GOOD
<div className="flex items-center justify-between p-4 bg-white dark:bg-gray-900">

// ❌ BAD (custom CSS)
<div className="header-container">
```

**Dark Mode Classes**:
```tsx
<div className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
```

**Responsive Classes**:
```tsx
<div className="text-sm md:text-base lg:text-lg">
```

### 10.4 File Naming

**Components**: PascalCase.tsx
```
CampaignList.tsx
EventDetailView.tsx
BudgetModal.tsx
```

**Services**: camelCase.ts
```
campaignService.ts
eventService.ts
apiService.ts
```

**Utilities**: camelCase.ts
```
dateUtils.ts
geocodingUtils.ts
```

### 10.5 Git Commit Messages

**Conventional Commits Format**:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `test`: Adding tests
- `chore`: Build, dependencies, tooling

**Examples**:
```bash
git commit -m "feat(campaigns): add budget tracking to campaigns"
git commit -m "fix(events): correct geolocation calculation for venues"
git commit -m "docs(readme): update installation instructions"
```

---

## 11. Troubleshooting Development Issues

### 11.1 TypeScript Errors

**Error**: `Module not found: Can't resolve '../types'`

**Solution**: Verify import path is correct
```tsx
// ✅ GOOD
import { Campaign } from '../types';

// ❌ BAD (missing extension)
import { Campaign } from '../types.ts';
```

**Error**: `Type 'string | undefined' is not assignable to type 'string'`

**Solution**: Add type guard or use optional chaining
```tsx
// ✅ GOOD
const owner = campaign.campaignOwner ?? 'Unknown';
```

**Error**: `Property 'xyz' does not exist on type 'Campaign'`

**Solution**: Ensure interface is updated in `types.ts`

### 11.2 Build Errors

**Error**: `npm install` fails with dependency conflicts

**Solution**: Delete `node_modules` and `package-lock.json`, reinstall
```bash
rm -rf node_modules package-lock.json
npm install
```

**Error**: Vite build fails with memory error

**Solution**: Increase Node.js memory limit
```bash
NODE_OPTIONS="--max-old-space-size=4096" npm run build
```

### 11.3 Runtime Errors

**Error**: API calls return 401 Unauthorized

**Solution**: Check JWT token is valid and not expired
```tsx
// Verify token in browser DevTools → Application → Session Storage
```

**Error**: Context is `undefined`

**Solution**: Ensure component is wrapped in Context Provider
```tsx
// App.tsx
<CampaignProvider>
  <CampaignList />
</CampaignProvider>
```

**Error**: Infinite re-renders

**Solution**: Add dependencies to `useEffect`
```tsx
// ❌ BAD (infinite loop)
useEffect(() => {
  fetchData();
});

// ✅ GOOD
useEffect(() => {
  fetchData();
}, []);  // Empty array = run once on mount
```

### 11.4 Performance Issues

**Problem**: Slow renders

**Solution**: Use `React.memo` to prevent unnecessary re-renders
```tsx
export default React.memo(CampaignCard);
```

**Problem**: Large bundle size

**Solution**: Analyze bundle with Vite build report
```bash
npm run build -- --mode analyze
```

**Problem**: Memory leaks

**Solution**: Clean up subscriptions in `useEffect`
```tsx
useEffect(() => {
  const subscription = api.subscribe();

  return () => {
    subscription.unsubscribe();  // Cleanup
  };
}, []);
```

---

## 12. Contributing Guidelines

### 12.1 Git Workflow

**Step 1: Create Feature Branch**:
```bash
git checkout -b feature/add-budget-tracking
```

**Step 2: Make Changes**:
```bash
# Edit files
git add .
git commit -m "feat(campaigns): add budget tracking fields"
```

**Step 3: Push to Remote**:
```bash
git push origin feature/add-budget-tracking
```

**Step 4: Open Pull Request**:
- Navigate to GitHub
- Click "Create Pull Request"
- Fill in PR template
- Request code review

**Step 5: Address Feedback**:
```bash
# Make changes based on review
git add .
git commit -m "fix(campaigns): address PR feedback"
git push origin feature/add-budget-tracking
```

**Step 6: Merge**:
- Once approved, merge to `main`
- Delete feature branch

### 12.2 Code Review Checklist

**Reviewer Checklist**:
- ✅ Code follows style guidelines
- ✅ TypeScript types are defined (no `any` types)
- ✅ No console errors or warnings
- ✅ Tests pass (if applicable)
- ✅ Documentation updated (if needed)
- ✅ Performance considerations addressed
- ✅ Security considerations addressed (no hardcoded secrets)

### 12.3 Testing Requirements

**All New Features Must Be Tested**:
- Unit tests for utility functions
- Integration tests for API endpoints
- Manual testing checklist completed

**No Regressions**:
- Existing features still work
- No new bugs introduced

### 12.4 Documentation Requirements

**Update USER-GUIDE.md**:
- Add new features to user documentation
- Include screenshots/examples

**Update API_DESIGN.md**:
- Document new endpoints
- Include request/response examples

**Add Code Comments**:
- Complex logic requires comments
- Use JSDoc for functions

---

## Appendix: Quick Reference

### Key File Paths

| Path | Description |
|------|-------------|
| `/home/user/UXP/types.ts` | TypeScript interfaces (1,238 lines) |
| `/home/user/UXP/App.tsx` | Main app component |
| `/home/user/UXP/components/` | React components (131 files) |
| `/home/user/UXP/contexts/` | Context providers (8 files) |
| `/home/user/UXP/services/` | API service layer |
| `/home/user/UXP/backend/routes/` | API route handlers |
| `/home/user/UXP/backend/database/migrations/` | SQL migration scripts |

### Common Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies |
| `npm run dev` | Start frontend dev server |
| `cd backend && npm run dev` | Start backend dev server |
| `npm run build` | Build frontend for production |
| `npm run migrate` | Run database migrations |
| `npm test` | Run tests |

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `VITE_AZURE_CLIENT_ID` | ✅ | Azure AD client ID |
| `VITE_API_BASE_URL` | ✅ | Backend API URL |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key |
| `DB_SERVER` | ✅ | Database server |
| `DB_DATABASE` | ✅ | Database name |
| `DB_USER` | ✅ | Database username |
| `DB_PASSWORD` | ✅ | Database password |

---

**End of Developer Guide**

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Total Pages**: 28 pages
