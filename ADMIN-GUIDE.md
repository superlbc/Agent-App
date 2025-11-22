# UXP Administrator Guide

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Platform**: Unified Experience Platform (UXP)

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Installation & Setup](#2-installation--setup)
3. [User Management](#3-user-management)
4. [Client & Program Management](#4-client--program-management)
5. [Integration Configuration](#5-integration-configuration)
6. [Database Management](#6-database-management)
7. [Monitoring & Logging](#7-monitoring--logging)
8. [Security & Access Control](#8-security--access-control)
9. [Troubleshooting](#9-troubleshooting)
10. [Maintenance Tasks](#10-maintenance-tasks)

---

## 1. System Overview

### 1.1 Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────┐
│                          End Users (Browser)                         │
│                     HTTPS: https://uxp.company.com                  │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                        Azure Load Balancer                           │
│                     SSL Termination (HTTPS → HTTP)                   │
└───────────────────────────┬─────────────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────┐
│  Frontend Web Server  │           │  Backend API Server   │
│  (React + Vite)       │           │  (Node.js + Express)  │
│  Port: 5173           │           │  Port: 8080           │
│                       │           │                       │
│  Static Files:        │           │  REST API:            │
│  - HTML, CSS, JS      │◄─────────►│  - /api/campaigns     │
│  - Images, Fonts      │  API Call │  - /api/events        │
│  - Build: npm run     │           │  - /api/venues        │
│    build              │           │  - /api/assignments   │
└───────────────────────┘           └───────┬───────────────┘
                                            │
                    ┌───────────────────────┼───────────────────────┐
                    │                       │                       │
                    ▼                       ▼                       ▼
        ┌─────────────────────┐ ┌─────────────────────┐ ┌─────────────────────┐
        │  Azure SQL Database │ │  Azure AD (Auth)    │ │ External Integrations│
        │  - Campaigns        │ │  - User Auth        │ │  - Brandscopic API  │
        │  - Events           │ │  - Group Membership │ │  - QRTiger API      │
        │  - Venues           │ │  - JWT Tokens       │ │  - Placer.ai API    │
        │  - Assignments      │ └─────────────────────┘ │  - Google Maps API  │
        └─────────────────────┘                         │  - Smartsheet API   │
                                                        └─────────────────────┘
```

### 1.2 System Components

**Frontend (React + TypeScript)**:
- **Framework**: React 18.2.0
- **Build Tool**: Vite 5.x
- **Styling**: Tailwind CSS 3.x
- **State Management**: React Context API
- **Authentication**: MSAL Browser 3.x
- **Deployment**: Static files served via Nginx or Cloud Run

**Backend (Node.js + Express)**:
- **Runtime**: Node.js 18+ LTS
- **Framework**: Express 4.x
- **Authentication**: JWT validation, Azure AD group checks
- **Database Client**: `mssql` (Microsoft SQL Server driver)
- **Deployment**: Google Cloud Run or Azure App Service

**Database (Azure SQL)**:
- **Provider**: Azure SQL Database (Managed Service)
- **Version**: SQL Server 2019 or later
- **Features**: Connection pooling, transaction support, full-text search
- **Migrations**: SQL scripts in `/backend/database/migrations/`

**External Integrations**:
- **Brandscopic**: Event sync, field reporting
- **QRTiger**: QR code generation and scan analytics
- **Placer.ai**: Venue footfall analytics
- **Google Maps**: Geolocation, geocoding, distance calculations
- **Smartsheet**: Data export for project management

### 1.3 User Roles and Permissions

UXP uses a **Role-Based Access Control (RBAC)** system with 6 default roles:

| Role | Description | Key Permissions |
|------|-------------|-----------------|
| **admin** | Full system access | All 26 permissions |
| **agency-lead** | Senior leadership, manages campaigns and budgets | 19 permissions (campaign/event CRUD, finance, user management) |
| **account-manager** | Client-facing, manages campaigns | 11 permissions (campaign CRUD, event read, export) |
| **event-manager** | Operational, manages events and venues | 13 permissions (event CRUD, venue CRUD, assignments) |
| **field-manager** | Oversees on-site execution | 7 permissions (event read, assignments view, QR view) |
| **brand-ambassador** | On-site staff | 3 permissions (event read, view own assignments) |

**Permission List** (26 total):

**Campaign Permissions**:
- `CAMPAIGN_CREATE`, `CAMPAIGN_READ`, `CAMPAIGN_UPDATE`, `CAMPAIGN_DELETE`, `CAMPAIGN_EXPORT`

**Event Permissions**:
- `EVENT_CREATE`, `EVENT_READ`, `EVENT_UPDATE`, `EVENT_DELETE`, `EVENT_ASSIGN_PEOPLE`, `EVENT_EXPORT`

**Venue Permissions**:
- `VENUE_CREATE`, `VENUE_READ`, `VENUE_UPDATE`, `VENUE_DELETE`, `VENUE_VERIFY`

**People Permissions**:
- `PEOPLE_ASSIGN`, `PEOPLE_VIEW`, `PEOPLE_MANAGE`

**QR Code Permissions**:
- `QR_GENERATE`, `QR_VIEW_ANALYTICS`, `QR_MANAGE`

**Finance Permissions**:
- `FINANCE_VIEW_COSTS`, `FINANCE_MANAGE_BUDGETS`, `FINANCE_EXPORT_REPORTS`

**Admin Permissions**:
- `ADMIN_USER_MANAGEMENT`, `ADMIN_ROLE_MANAGEMENT`, `ADMIN_SYSTEM_CONFIG`

---

## 2. Installation & Setup

### 2.1 Prerequisites

**Required Software**:
- Node.js 18+ LTS (`node --version` to verify)
- npm 9+ (`npm --version` to verify)
- Git (`git --version` to verify)
- Azure SQL Database (or SQL Server 2019+)
- Azure AD app registration (for authentication)

**Required Accounts**:
- Azure subscription (for SQL Database, App Service, or Cloud Run deployment)
- Azure AD tenant (for user authentication)
- Google Cloud account (if deploying to Cloud Run)
- API keys for integrations (Brandscopic, QRTiger, Placer.ai, Google Maps)

### 2.2 Environment Variables

**Frontend Environment Variables** (`.env.local`):

Create `/home/user/UXP/.env.local`:

```env
# Azure AD Authentication
VITE_AZURE_CLIENT_ID=your-azure-ad-client-id
VITE_AZURE_TENANT_ID=your-azure-ad-tenant-id
VITE_AZURE_REDIRECT_URI=http://localhost:5173

# Backend API
VITE_API_BASE_URL=http://localhost:8080/api

# Google Maps API (for geolocation)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Feature Flags (optional)
VITE_ENABLE_PLACER_AI=true
VITE_ENABLE_BRANDSCOPIC=true
VITE_ENABLE_QRTIGER=true
```

**Backend Environment Variables** (`.env`):

Create `/home/user/UXP/backend/.env`:

```env
# Server Configuration
NODE_ENV=development
PORT=8080

# Database Connection (Azure SQL)
DB_SERVER=your-db-server.database.windows.net
DB_DATABASE=uxp_prod
DB_USER=your-db-admin
DB_PASSWORD=your-secure-password
DB_PORT=1433
DB_ENCRYPT=true

# Azure AD Authentication
AZURE_TENANT_ID=your-azure-ad-tenant-id
AZURE_CLIENT_ID=your-azure-ad-client-id
AZURE_CLIENT_SECRET=your-client-secret
AZURE_REQUIRED_GROUP_ID=your-authorized-group-id

# External API Keys
BRANDSCOPIC_API_KEY=your-brandscopic-api-key
BRANDSCOPIC_TENANT_ID=your-brandscopic-tenant-id
QRTIGER_API_KEY=your-qrtiger-api-key
PLACER_AI_API_KEY=your-placer-ai-api-key
SMARTSHEET_ACCESS_TOKEN=your-smartsheet-token
GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Feature Flags
ENABLE_PLACER_AI=true
ENABLE_BRANDSCOPIC=true
ENABLE_QRTIGER=true
ENABLE_SMARTSHEET=false
```

**Security Note**: Never commit `.env` or `.env.local` files to version control. Add them to `.gitignore`.

### 2.3 Database Setup

**Step 1: Create Azure SQL Database**

```bash
# Using Azure CLI
az sql server create \
  --name uxp-sql-server \
  --resource-group uxp-rg \
  --location eastus \
  --admin-user dbadmin \
  --admin-password YourSecurePassword123!

az sql db create \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name uxp_prod \
  --service-objective S0
```

**Step 2: Configure Firewall Rules**

```bash
# Allow Azure services
az sql server firewall-rule create \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name AllowAzureServices \
  --start-ip-address 0.0.0.0 \
  --end-ip-address 0.0.0.0

# Allow your IP for development
az sql server firewall-rule create \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name AllowMyIP \
  --start-ip-address YOUR_IP \
  --end-ip-address YOUR_IP
```

**Step 3: Run Database Migrations**

```bash
cd /home/user/UXP/backend

# Install dependencies
npm install

# Run migrations
npm run migrate
```

**Migration Files Location**: `/home/user/UXP/backend/database/migrations/`

**Migration Script** (`package.json`):
```json
{
  "scripts": {
    "migrate": "node database/migrate.js"
  }
}
```

**Expected Output**:
```
Running migration: 100_uxp_core.sql
✓ Created table: Campaigns
✓ Created table: Events
✓ Created table: Venues
✓ Created table: PeopleAssignments
✓ Created table: QRCodes
✓ Created table: Users
✓ Created table: Clients
✓ Created table: Programs
Migration completed successfully
```

**Step 4: Seed Initial Data** (optional)

```bash
npm run seed
```

Seeds:
- Default clients (e.g., "AMEX", "Verizon")
- Default programs
- Sample campaigns and events (for testing)
- Default user roles

### 2.4 Build & Deployment

**Local Development**:

**Terminal 1: Start Backend**
```bash
cd /home/user/UXP/backend
npm install
npm run dev
```

**Terminal 2: Start Frontend**
```bash
cd /home/user/UXP
npm install
npm run dev
```

**Access**: Open browser to `http://localhost:5173`

**Production Build**:

**Build Frontend**:
```bash
cd /home/user/UXP
npm run build
```

Output: `/dist` folder with optimized static files

**Deploy to Google Cloud Run**:

```bash
# Build Docker image
docker build -t gcr.io/your-project/uxp-frontend:latest .

# Push to Container Registry
docker push gcr.io/your-project/uxp-frontend:latest

# Deploy to Cloud Run
gcloud run deploy uxp-frontend \
  --image gcr.io/your-project/uxp-frontend:latest \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

**Deploy to Azure App Service**:

```bash
# Create App Service Plan
az appservice plan create \
  --name uxp-plan \
  --resource-group uxp-rg \
  --sku B1 \
  --is-linux

# Create Web App
az webapp create \
  --resource-group uxp-rg \
  --plan uxp-plan \
  --name uxp-app \
  --runtime "NODE|18-lts"

# Deploy code
az webapp deployment source config-local-git \
  --name uxp-app \
  --resource-group uxp-rg

git remote add azure https://uxp-app.scm.azurewebsites.net:443/uxp-app.git
git push azure main
```

**Configure Environment Variables in Cloud**:

**Google Cloud Run**:
```bash
gcloud run services update uxp-backend \
  --set-env-vars="DB_SERVER=...,DB_DATABASE=...,DB_USER=...,DB_PASSWORD=..."
```

**Azure App Service**:
```bash
az webapp config appsettings set \
  --name uxp-app \
  --resource-group uxp-rg \
  --settings DB_SERVER=... DB_DATABASE=... DB_USER=... DB_PASSWORD=...
```

---

## 3. User Management

### 3.1 Creating Users

**Option 1: Sync from Azure AD** (Recommended)

**Steps**:
1. Log in to UXP as admin
2. Navigate to **Admin** → **Users**
3. Click **"Sync from Azure AD"** button
4. Search for user by name or email
5. Select user from search results
6. Assign role (admin, agency-lead, account-manager, etc.)
7. Assign client access:
   - Multi-select specific clients
   - OR select "All Clients"
8. Click **"Create User"**

**What Happens**:
- User is created in UXP database
- User's profile is enriched with Azure AD data (name, email, job title, department)
- User's permissions are set based on role
- User can now log in to UXP

**Option 2: Manual User Creation**

**Use Case**: For external contractors or users not in Azure AD

**Steps**:
1. Navigate to **Admin** → **Users**
2. Click **"+ Create User"** button
3. Fill in user details:
   - Name (required)
   - Email (required, must be unique)
   - Role (required)
   - Client Access (multi-select)
   - Department (optional)
   - Job Title (optional)
4. Click **"Create User"**

**Note**: Manually created users must still authenticate via Azure AD (email must exist in tenant).

### 3.2 Assigning Roles

**Steps to Change User Role**:
1. Navigate to **Admin** → **Users**
2. Search for user
3. Click **"Edit"** button
4. Change **Role** dropdown
5. Click **"Save"**

**Role Hierarchy**:

```
admin (Full Access)
    │
    ├─ agency-lead (Campaign + Budget Management)
    │
    ├─ account-manager (Campaign Management)
    │
    ├─ event-manager (Event Operations)
    │
    ├─ field-manager (On-Site Supervision)
    │
    └─ brand-ambassador (Limited View)
```

**Permission Impact**:
- Changing role immediately updates permissions
- User may lose access to certain features
- Audit log tracks role changes

### 3.3 Client Access Control

**Purpose**: Restrict users to only view/edit campaigns and events for assigned clients

**Configuring Client Access**:

**Option 1: Assign Specific Clients**
1. Navigate to **Admin** → **Users**
2. Click **"Edit"** next to user
3. In **Client Access** section:
   - Multi-select clients (e.g., "AMEX", "Verizon")
4. Click **"Save"**

**Result**: User can only see campaigns/events for AMEX and Verizon

**Option 2: Grant "All Clients" Access**
1. Check the **"All Clients"** checkbox
2. Click **"Save"**

**Result**: User can see campaigns/events for all clients (typical for admins and business leaders)

**Enforcement**:
- Frontend filters campaigns/events by client access
- Backend API validates client access on every request
- Unauthorized access returns HTTP 403 Forbidden

### 3.4 Deactivating Users

**When to Deactivate**:
- User leaves the company
- User changes role and no longer needs UXP access
- External contractor completes project

**Steps**:
1. Navigate to **Admin** → **Users**
2. Search for user
3. Click **"Deactivate"** button
4. Confirm deactivation in modal

**Impact**:
- User can no longer log in
- User's existing assignments remain (for historical records)
- User's data is soft-deleted (can be reactivated later if needed)

**Reactivating a User**:
1. Navigate to **Admin** → **Users**
2. Check **"Show Deactivated Users"** checkbox
3. Search for user
4. Click **"Reactivate"** button

---

## 4. Client & Program Management

### 4.1 Creating Clients

**Steps**:
1. Navigate to **Admin** → **Clients**
2. Click **"+ Create Client"** button
3. Fill in client details:
   - **Client Name**: Full name (e.g., "American Express")
   - **Client Code**: Short code (e.g., "AMEX") — must be unique
   - **Logo Upload**: Upload client logo (PNG, JPG, SVG) — max 2MB
   - **Integration Toggles**:
     - ☑ Enable Brandscopic
     - ☑ Enable QR Tiger
     - ☑ Enable Qualtrics
4. Click **"Create Client"**

**Client Code Naming Conventions**:
- Use uppercase letters
- 3-6 characters (e.g., "AMEX", "VZ", "COKE")
- No spaces or special characters

### 4.2 Managing Programs

**What Are Programs?**

Programs are parent containers for related campaigns across multiple years (e.g., "NFL Sponsorship" program contains campaigns for 2023, 2024, 2025).

**Creating Programs**:

1. Navigate to **Admin** → **Programs**
2. Click **"+ Create Program"** button
3. Fill in program details:
   - **Program Name**: Descriptive name (e.g., "NFL Sponsorship")
   - **Program Code**: Short code (e.g., "NFL-SPONS")
   - **Client**: Select associated client (e.g., "Verizon")
   - **Logo Upload**: Upload program logo (optional)
4. Click **"Create Program"**

**Associating Programs with Campaigns**:
- When creating a campaign, select "Master Program" from dropdown
- Links campaign to program for multi-year reporting

### 4.3 Deleting Clients/Programs

**Validation Rules**:

**Cannot Delete Client If**:
- Client has one or more campaigns
- Client has active user assignments

**Cannot Delete Program If**:
- Program has one or more campaigns linked to it

**Steps to Delete**:
1. Verify no campaigns exist (or unlink/delete campaigns first)
2. Navigate to **Admin** → **Clients** or **Programs**
3. Click **"Delete"** button next to client/program
4. Confirm deletion

**Warning**: Deletion is permanent and cannot be undone.

---

## 5. Integration Configuration

### 5.1 Brandscopic Integration

**Purpose**: Sync event data to Brandscopic platform for field reporting

**Configuration Steps**:

1. Obtain Brandscopic API credentials:
   - Log in to Brandscopic admin panel
   - Navigate to **Settings** → **API**
   - Generate API key and note Tenant ID

2. Add to backend `.env`:
```env
BRANDSCOPIC_API_KEY=your-api-key-here
BRANDSCOPIC_TENANT_ID=your-tenant-id-here
ENABLE_BRANDSCOPIC=true
```

3. Restart backend server:
```bash
npm run dev
```

4. Test connection:
```bash
curl -X POST http://localhost:8080/api/integrations/brandscopic/test \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Brandscopic connection successful",
  "tenantId": "your-tenant-id"
}
```

**Troubleshooting**:
- **Error: "Invalid API key"**: Verify API key is correct and active in Brandscopic
- **Error: "Tenant not found"**: Verify Tenant ID matches your Brandscopic account

### 5.2 Placer.ai Integration

**Purpose**: Retrieve venue footfall analytics and demographic insights

**Configuration Steps**:

1. Obtain Placer.ai API key:
   - Contact Placer.ai support to request API access
   - Receive API key via email

2. Add to backend `.env`:
```env
PLACER_AI_API_KEY=your-placer-ai-api-key
ENABLE_PLACER_AI=true
```

3. Restart backend server

4. Link venues to Placer.ai:
   - Navigate to **Admin** → **Venues**
   - Edit venue
   - Enter **Placer.ai Venue ID** (obtained from Placer.ai platform)
   - Click **"Save"**

**Testing**:
```bash
curl -X GET "http://localhost:8080/api/venues/{venueId}/placer-ai" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response**:
```json
{
  "venueId": "venue-123",
  "footfallData": {
    "dailyTraffic": 5420,
    "weeklyTraffic": 37940,
    "peakHours": ["11:00-13:00", "17:00-19:00"]
  }
}
```

### 5.3 Smartsheet Integration

**Purpose**: Export UXP data to Smartsheet for project management

**Configuration Steps**:

1. Generate Smartsheet access token:
   - Log in to Smartsheet
   - Navigate to **Account** → **Apps & Integrations** → **API Access**
   - Click **"Generate new access token"**
   - Copy token

2. Add to backend `.env`:
```env
SMARTSHEET_ACCESS_TOKEN=your-smartsheet-token-here
ENABLE_SMARTSHEET=true
```

3. Create Smartsheet templates:
   - Create a Smartsheet with columns matching UXP campaign/event fields
   - Note the Sheet ID (from URL: `https://app.smartsheet.com/sheets/{sheetId}`)

4. Configure sheet mapping:
```bash
# Create mapping file: /backend/config/smartsheet-mapping.json
{
  "campaignSheetId": "your-campaign-sheet-id",
  "eventSheetId": "your-event-sheet-id",
  "fieldMapping": {
    "campaignName": "Campaign Name",
    "client": "Client",
    "eventStartDate": "Start Date"
  }
}
```

**Testing**:
```bash
curl -X POST http://localhost:8080/api/integrations/smartsheet/export \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"campaignId": "campaign-123"}'
```

### 5.4 QRTiger Integration

**Purpose**: Generate QR codes and track scan analytics

**Configuration Steps**:

1. Sign up for QRTiger account (https://www.qrtiger.com/)

2. Generate API key:
   - Log in to QRTiger dashboard
   - Navigate to **Settings** → **API**
   - Generate API key

3. Add to backend `.env`:
```env
QRTIGER_API_KEY=your-qrtiger-api-key
ENABLE_QRTIGER=true
```

4. Restart backend server

**Testing**:
```bash
curl -X POST http://localhost:8080/api/events/{eventId}/qr-codes \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test QR Code",
    "destinationUrl": "https://survey.momentumww.com/event-123"
  }'
```

**Expected Response**:
```json
{
  "id": "qr-456",
  "eventId": "event-123",
  "name": "Test QR Code",
  "codeData": "https://qrco.de/abc123",
  "generatedOn": "2025-11-22T10:00:00Z",
  "scanCount": 0,
  "qrtigerId": "qrt-789",
  "qrtigerPath": "/v1/qr-codes/qrt-789"
}
```

### 5.5 Google Maps API

**Purpose**: Geolocation, geocoding, distance calculations, and map views

**Configuration Steps**:

1. Create Google Cloud project:
```bash
gcloud projects create uxp-maps --name="UXP Maps"
```

2. Enable APIs:
```bash
gcloud services enable maps-backend.googleapis.com --project=uxp-maps
gcloud services enable places-backend.googleapis.com --project=uxp-maps
gcloud services enable geocoding-backend.googleapis.com --project=uxp-maps
```

3. Create API key:
```bash
gcloud alpha services api-keys create \
  --display-name="UXP Google Maps Key" \
  --project=uxp-maps
```

4. Add to both frontend and backend `.env`:
```env
# Frontend (.env.local)
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Backend (.env)
GOOGLE_MAPS_API_KEY=your-google-maps-api-key
```

**API Restrictions** (Recommended for Security):
- Restrict API key to specific domains (e.g., `uxp.company.com`)
- Restrict to specific APIs (Maps JavaScript API, Geocoding API, Places API)

**Billing Configuration**:
- Google Maps API requires billing account
- Monitor usage to avoid unexpected charges
- Set budget alerts in Google Cloud Console

---

## 6. Database Management

### 6.1 Database Schema Overview

**Core Tables** (8 tables):

| Table | Description | Key Relationships |
|-------|-------------|-------------------|
| `Campaigns` | Top-level marketing campaigns | → Events (1:N) |
| `Events` | Individual activations | → Campaigns (N:1), → Venues (1:1) |
| `Venues` | Event locations | ← Events (1:N) |
| `PeopleAssignments` | Team member assignments | → Events (N:1) |
| `QRCodes` | QR code tracking | → Events (N:1) |
| `Users` | System users | → Clients (N:M via UserClients) |
| `Clients` | Client companies | → Campaigns (1:N) |
| `Programs` | Multi-year programs | → Campaigns (1:N) |

**Relationship Diagram**:

```
Clients (1) ────► (N) Campaigns (1) ────► (N) Events (1) ────► (N) PeopleAssignments
    │                     │                     │
    │                     │                     └────► (N) QRCodes
    │                     │
    │                     └────► (N) Programs
    │
    └────► (N:M) Users
```

**Key Indexes**:
- `Campaigns.client` (for client filtering)
- `Events.campaignId` (for campaign detail view)
- `Venues.city` (for location search)
- `PeopleAssignments.eventId` (for team rosters)

### 6.2 Running Migrations

**Migration Files Location**: `/home/user/UXP/backend/database/migrations/`

**Naming Convention**: `{number}_{description}.sql`

Example:
- `100_uxp_core.sql` — Core tables
- `110_add_budget_fields.sql` — Add budget tracking
- `120_add_placer_ai_fields.sql` — Add Placer.ai integration

**Running Migrations**:

```bash
cd /home/user/UXP/backend
npm run migrate
```

**Migration Script** (`database/migrate.js`):
```javascript
const fs = require('fs');
const path = require('path');
const sql = require('mssql');

async function runMigrations() {
  const pool = await sql.connect(config);
  const files = fs.readdirSync('./database/migrations').sort();

  for (const file of files) {
    console.log(`Running migration: ${file}`);
    const script = fs.readFileSync(path.join('./database/migrations', file), 'utf8');
    await pool.request().query(script);
    console.log(`✓ Completed: ${file}`);
  }

  await pool.close();
}

runMigrations();
```

**Rolling Back Migrations**:

Create rollback scripts: `{number}_{description}_rollback.sql`

Example: `110_add_budget_fields_rollback.sql`
```sql
ALTER TABLE Campaigns DROP COLUMN budgetPlanned;
ALTER TABLE Campaigns DROP COLUMN budgetActual;
```

Run rollback:
```bash
npm run migrate:rollback
```

### 6.3 Backup and Restore

**Automated Backups** (Azure SQL):

Azure SQL automatically creates backups:
- **Point-in-time restore**: 7-35 days (configurable)
- **Long-term retention**: Up to 10 years (if configured)

**Manual Backup**:

```bash
# Export to BACPAC file
az sql db export \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name uxp_prod \
  --storage-key-type StorageAccessKey \
  --storage-key YOUR_STORAGE_KEY \
  --storage-uri https://yourstorage.blob.core.windows.net/backups/uxp_prod.bacpac
```

**Restore Procedure**:

```bash
# Restore from BACPAC
az sql db import \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name uxp_prod_restored \
  --storage-key-type StorageAccessKey \
  --storage-key YOUR_STORAGE_KEY \
  --storage-uri https://yourstorage.blob.core.windows.net/backups/uxp_prod.bacpac
```

**Point-in-Time Restore**:

```bash
# Restore to specific timestamp
az sql db restore \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --name uxp_prod_restored \
  --source-database uxp_prod \
  --time "2025-11-22T10:00:00Z"
```

### 6.4 Performance Tuning

**Indexing Strategy**:

**Existing Indexes** (created by migrations):
- `idx_campaigns_client` on `Campaigns(client)`
- `idx_events_campaignId` on `Events(campaignId)`
- `idx_events_city` on `Events(city)`
- `idx_venues_city` on `Venues(city)`
- `idx_assignments_eventId` on `PeopleAssignments(eventId)`

**Adding Custom Indexes**:

```sql
-- Example: Add index for filtering by event status
CREATE INDEX idx_events_status ON Events(status);

-- Composite index for campaign list filtering
CREATE INDEX idx_campaigns_client_year ON Campaigns(client, year);
```

**Query Optimization**:

**Slow Query Example**:
```sql
-- Before: Full table scan
SELECT * FROM Events WHERE YEAR(eventStartDate) = 2025;
```

**Optimized Query**:
```sql
-- After: Use index-friendly date range
SELECT * FROM Events
WHERE eventStartDate >= '2025-01-01'
  AND eventStartDate < '2026-01-01';
```

**Connection Pooling**:

Backend uses connection pooling via `mssql` package:

```javascript
// backend/config/database.js
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: parseInt(process.env.DB_PORT),
  pool: {
    max: 10,  // Maximum number of connections
    min: 0,   // Minimum number of connections
    idleTimeoutMillis: 30000  // Close idle connections after 30s
  }
};
```

**Monitoring Query Performance**:

```sql
-- View slow queries (Azure SQL)
SELECT
  qt.text AS query_text,
  qs.execution_count,
  qs.total_worker_time / 1000000 AS total_cpu_time_sec,
  qs.total_elapsed_time / 1000000 AS total_elapsed_time_sec
FROM sys.dm_exec_query_stats qs
CROSS APPLY sys.dm_exec_sql_text(qs.sql_handle) qt
ORDER BY qs.total_worker_time DESC;
```

---

## 7. Monitoring & Logging

### 7.1 Application Logs

**Log Locations**:

**Local Development**:
- Frontend: Browser console (`F12` → Console tab)
- Backend: Terminal output (`npm run dev`)

**Production (Cloud Run)**:
```bash
# View backend logs
gcloud logging read "resource.type=cloud_run_revision AND resource.labels.service_name=uxp-backend" --limit 50
```

**Production (Azure App Service)**:
```bash
# Enable logging
az webapp log config \
  --name uxp-app \
  --resource-group uxp-rg \
  --application-logging filesystem \
  --level information

# View logs
az webapp log tail \
  --name uxp-app \
  --resource-group uxp-rg
```

**Log Levels**:
- `DEBUG`: Detailed diagnostic info (development only)
- `INFO`: General informational messages
- `WARN`: Warning messages (non-critical issues)
- `ERROR`: Error messages (critical failures)

### 7.2 Error Tracking

**Backend Error Logging**:

Backend logs all errors with stack traces:

```javascript
// Example error log
app.use((err, req, res, next) => {
  console.error(`[ERROR] ${err.message}`);
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error' });
});
```

**Common Error Patterns**:

**Database Connection Errors**:
```
[ERROR] Failed to connect to database
Error: connect ETIMEDOUT
```
**Solution**: Check database firewall rules, verify connection string

**Authentication Errors**:
```
[ERROR] JWT validation failed: Token expired
```
**Solution**: User needs to re-authenticate

**Integration API Errors**:
```
[ERROR] Brandscopic sync failed: API returned 401 Unauthorized
```
**Solution**: Verify API key is valid and not expired

### 7.3 Performance Monitoring

**Metrics to Monitor**:

**Response Times**:
- Frontend: Page load time (target: < 2s)
- Backend: API response time (target: < 500ms)

**Database Performance**:
- Query execution time (target: < 100ms)
- Connection pool utilization (target: < 80%)

**External API Performance**:
- Brandscopic sync time (target: < 5s per event)
- Placer.ai data fetch time (target: < 2s per venue)
- Google Maps geocoding time (target: < 500ms)

**Monitoring Tools**:

**Azure Application Insights** (if using Azure App Service):
```bash
az monitor app-insights component create \
  --app uxp-insights \
  --location eastus \
  --resource-group uxp-rg
```

**Google Cloud Monitoring** (if using Cloud Run):
- Navigate to Cloud Console → Monitoring
- View service metrics (request count, latency, error rate)

### 7.4 Integration Health Checks

**Endpoint**: `GET /api/integrations/health`

**Response**:
```json
{
  "brandscopic": {
    "status": "healthy",
    "lastChecked": "2025-11-22T10:00:00Z",
    "responseTime": 234
  },
  "qrtiger": {
    "status": "healthy",
    "lastChecked": "2025-11-22T10:00:00Z",
    "responseTime": 156
  },
  "placerAi": {
    "status": "degraded",
    "lastChecked": "2025-11-22T10:00:00Z",
    "responseTime": 2340,
    "warning": "Response time > 2000ms"
  },
  "googleMaps": {
    "status": "healthy",
    "lastChecked": "2025-11-22T10:00:00Z",
    "responseTime": 89
  }
}
```

**Status Codes**:
- `healthy`: Integration responding normally
- `degraded`: Integration slow but functional
- `unhealthy`: Integration not responding or returning errors

---

## 8. Security & Access Control

### 8.1 Azure AD Authentication

**App Registration Steps**:

1. Navigate to Azure Portal → Azure Active Directory → App registrations
2. Click **"+ New registration"**
3. Fill in details:
   - **Name**: UXP
   - **Supported account types**: Single tenant
   - **Redirect URI**: `https://uxp.company.com` (production) or `http://localhost:5173` (development)
4. Click **"Register"**

**Required API Permissions**:

Navigate to **API permissions** → **Add a permission** → **Microsoft Graph**:

- `User.Read` (Read user profile)
- `User.Read.All` (Read all user profiles, for team assignment search)
- `Group.Read.All` (Read group membership, for RBAC group checks)

Click **"Grant admin consent"** to approve permissions.

**Client Secret Generation**:

1. Navigate to **Certificates & secrets**
2. Click **"+ New client secret"**
3. Enter description and expiration (12 months, 24 months, or never)
4. Click **"Add"**
5. **Copy the secret value immediately** (shown only once)
6. Add to backend `.env`:
```env
AZURE_CLIENT_SECRET=your-client-secret-here
```

### 8.2 Role-Based Access Control (RBAC)

**RBAC Implementation**:

Backend middleware validates permissions on every API request:

```javascript
// backend/middleware/auth.js
function requirePermission(permission) {
  return async (req, res, next) => {
    const userId = req.user.id;
    const user = await getUserById(userId);

    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
}

// Usage in routes
app.get('/api/campaigns', requirePermission('CAMPAIGN_READ'), getCampaigns);
app.post('/api/campaigns', requirePermission('CAMPAIGN_CREATE'), createCampaign);
```

**Group-Based Access**:

UXP uses Azure AD group membership for authorization:

```javascript
// Check if user is in authorized group
const requiredGroupId = process.env.AZURE_REQUIRED_GROUP_ID;
const userGroups = req.user.groups; // From JWT token

if (!userGroups.includes(requiredGroupId)) {
  return res.status(403).json({ error: 'Access denied: User not in authorized group' });
}
```

### 8.3 API Security

**JWT Validation**:

All API requests require valid JWT token:

```javascript
// backend/middleware/auth.js
const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

async function validateJWT(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = await verifyToken(token);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid token' });
  }
}
```

**API Rate Limiting**:

Prevent abuse with rate limiting:

```javascript
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api', limiter);
```

### 8.4 Data Encryption

**At Rest (Azure SQL)**:

Azure SQL Database automatically encrypts data at rest using **Transparent Data Encryption (TDE)**.

Verify TDE is enabled:
```bash
az sql db tde show \
  --resource-group uxp-rg \
  --server uxp-sql-server \
  --database uxp_prod
```

**In Transit (HTTPS)**:

All API communication uses HTTPS:

**Local Development**: HTTP (http://localhost:8080)

**Production**: HTTPS only (https://uxp.company.com)

Enforce HTTPS in backend:
```javascript
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.header('x-forwarded-proto') !== 'https') {
      res.redirect(`https://${req.header('host')}${req.url}`);
    } else {
      next();
    }
  });
}
```

---

## 9. Troubleshooting

### 9.1 Authentication Issues

**Problem**: Users cannot log in (Azure AD errors)

**Symptoms**:
- "AADSTS50011: Redirect URI mismatch"
- "AADSTS700016: Application not found"
- "AADSTS700051: Response_type not supported"

**Solutions**:

**AADSTS50011 (Redirect URI mismatch)**:
- Verify redirect URI in Azure AD app registration matches frontend URL
- Check for trailing slashes: `https://uxp.company.com` vs `https://uxp.company.com/`

**AADSTS700016 (Application not found)**:
- Verify `VITE_AZURE_CLIENT_ID` in `.env.local` matches Azure AD app registration client ID
- Verify `VITE_AZURE_TENANT_ID` is correct

**AADSTS700051 (Response_type not supported)**:
- Azure AD app registration must have "ID tokens" enabled
- Navigate to Azure AD app → Authentication → Implicit grant → Check "ID tokens"

### 9.2 Integration Failures

**Problem**: Brandscopic sync fails

**Symptoms**:
- Sync status shows "Failed"
- Error: "Venue address not recognized"

**Solutions**:
- Edit venue to use Google Maps Address Autocomplete (standardized formatting)
- Ensure full address includes street, city, state, zip
- Verify Brandscopic API key is valid (test with `/api/integrations/brandscopic/test`)

**Problem**: QRTiger API rate limits

**Symptoms**:
- Error: "Rate limit exceeded"
- QR code generation fails

**Solutions**:
- QRTiger free tier: 100 QR codes per month
- Upgrade to paid tier or wait for rate limit reset
- Implement QR code caching (avoid regenerating existing codes)

### 9.3 Database Issues

**Problem**: Connection pool exhausted

**Symptoms**:
- Error: "Connection pool is full"
- API requests hang or timeout

**Solutions**:
- Increase connection pool size in `backend/config/database.js`:
```javascript
pool: {
  max: 20,  // Increase from 10 to 20
}
```
- Monitor active connections:
```sql
SELECT DB_NAME(dbid) as DBName,
    COUNT(dbid) as NumberOfConnections
FROM sys.sysprocesses
WHERE dbid > 0
GROUP BY dbid;
```
- Restart backend server to reset connections

**Problem**: Slow queries

**Symptoms**:
- API responses take > 5 seconds
- Database CPU utilization > 80%

**Solutions**:
- Add indexes for frequently filtered columns (see Section 6.4)
- Optimize queries to use index-friendly conditions
- Enable query execution plan in Azure SQL to identify bottlenecks

### 9.4 Performance Issues

**Problem**: Slow page loads

**Symptoms**:
- Frontend takes > 5 seconds to load
- Charts render slowly

**Solutions**:
- Clear browser cache
- Check network tab in browser DevTools (identify slow API calls)
- Optimize frontend bundle size:
```bash
npm run build -- --report
```
- Enable gzip compression on web server

**Problem**: Map loading slowly

**Symptoms**:
- Google Maps blank or takes > 10 seconds to load

**Solutions**:
- Verify Google Maps API key is valid
- Check API quota limits in Google Cloud Console
- Reduce number of map markers (implement marker clustering)
- Enable lazy loading for map component

---

## 10. Maintenance Tasks

### 10.1 Regular Maintenance Schedule

**Daily**:
- Review error logs (check for new errors or warnings)
- Monitor integration health checks (verify all integrations are "healthy")

**Weekly**:
- Review database performance (check slow queries, connection pool utilization)
- Review user activity logs (identify unusual patterns)
- Test backups (verify automated backups are working)

**Monthly**:
- Update dependencies (npm packages, Azure SQL patches)
- Review API usage quotas (Google Maps, Brandscopic, QRTiger)
- Audit user access (deactivate inactive users)
- Review database storage utilization (plan for scaling if needed)

**Quarterly**:
- Review and renew API keys (before expiration)
- Security audit (review access logs, update Azure AD app secrets)
- Performance review (analyze response times, optimize slow queries)
- Disaster recovery test (restore from backup to verify procedure)

### 10.2 Updating the Application

**Steps to Deploy New Version**:

1. **Test locally**:
```bash
git checkout main
git pull
npm install
npm run build
npm run dev  # Verify app works
```

2. **Run database migrations** (if schema changes):
```bash
cd backend
npm run migrate
```

3. **Deploy backend**:
```bash
# Google Cloud Run
gcloud run deploy uxp-backend \
  --source . \
  --region us-central1

# Azure App Service
git push azure main
```

4. **Deploy frontend**:
```bash
npm run build
# Upload /dist to hosting provider
```

5. **Verify deployment**:
- Test login
- Test campaign/event CRUD operations
- Test integrations (Brandscopic sync, QR code generation)

**Rollback Procedure**:

If new version has critical bugs:

1. Revert to previous Docker image (Cloud Run):
```bash
gcloud run services update-traffic uxp-backend \
  --to-revisions=uxp-backend-00042-xyz=100
```

2. Or rollback Git commit:
```bash
git revert HEAD
git push azure main
```

### 10.3 User Support

**Common User Requests**:

**Request**: "I can't see campaigns for Client X"
**Solution**: Grant client access via Admin → Users → Edit user → Assign Client X

**Request**: "I need to export all events for 2025"
**Solution**: Navigate to Events → List View → Filter by Year 2025 → Export

**Request**: "How do I generate a QR code?"
**Solution**: Direct to User Guide Section 6.2 (QR Code Management)

**Request**: "Brandscopic sync failing for my event"
**Solution**: Check venue address (must use Google Maps Autocomplete) + verify Brandscopic API key is valid

**Creating Support Tickets**:

Use standardized template:

```
**User Name**: Jane Doe
**Email**: jane.doe@company.com
**Issue Type**: [Access Issue / Integration Error / Bug Report / Feature Request]
**Description**: [Detailed description]
**Steps to Reproduce**: [1. Step one, 2. Step two, ...]
**Expected Behavior**: [What should happen]
**Actual Behavior**: [What actually happens]
**Screenshots**: [Attach if applicable]
**Urgency**: [Low / Medium / High / Critical]
```

---

## Appendix: Command Reference

| Task | Command |
|------|---------|
| Install dependencies | `npm install` |
| Run frontend dev server | `npm run dev` |
| Build frontend for production | `npm run build` |
| Run backend dev server | `cd backend && npm run dev` |
| Run database migrations | `cd backend && npm run migrate` |
| Seed database with test data | `cd backend && npm run seed` |
| View backend logs (Cloud Run) | `gcloud logging read "resource.type=cloud_run_revision" --limit 50` |
| Deploy to Cloud Run | `gcloud run deploy uxp-backend --source .` |
| Create Azure SQL backup | `az sql db export --resource-group uxp-rg --server uxp-sql-server --name uxp_prod ...` |
| Restore Azure SQL database | `az sql db restore --resource-group uxp-rg --server uxp-sql-server --name uxp_prod ...` |

---

## Appendix: Environment Variable Reference

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `VITE_AZURE_CLIENT_ID` | ✅ | Azure AD client ID | `abc123...` |
| `VITE_AZURE_TENANT_ID` | ✅ | Azure AD tenant ID | `def456...` |
| `VITE_AZURE_REDIRECT_URI` | ✅ | OAuth redirect URI | `https://uxp.company.com` |
| `VITE_API_BASE_URL` | ✅ | Backend API URL | `https://api.company.com` |
| `VITE_GOOGLE_MAPS_API_KEY` | ✅ | Google Maps API key | `AIza...` |
| `DB_SERVER` | ✅ | Database server | `uxp-sql.database.windows.net` |
| `DB_DATABASE` | ✅ | Database name | `uxp_prod` |
| `DB_USER` | ✅ | Database username | `dbadmin` |
| `DB_PASSWORD` | ✅ | Database password | `SecurePassword123!` |
| `BRANDSCOPIC_API_KEY` | ❌ | Brandscopic API key | (if integration enabled) |
| `QRTIGER_API_KEY` | ❌ | QRTiger API key | (if integration enabled) |
| `PLACER_AI_API_KEY` | ❌ | Placer.ai API key | (if integration enabled) |

---

**End of Administrator Guide**

**Version**: 1.0.0
**Last Updated**: November 22, 2025
**Total Pages**: 18 pages
