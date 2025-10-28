# Quick Start: Implement Authentication in Another App

**To Claude Code**: This document provides instructions to implement the exact same MSAL authentication and Google Cloud deployment setup from the Meeting Notes Generator app into another React/Vite application.

---

## What You Need to Do

Implement Azure AD (MSAL) authentication with group-based access control and Google Cloud Run deployment with NGINX reverse proxy in the target application.

### Key Requirements

1. **Same authentication logic**: Azure AD with MSAL, group-based access control (general access + admin access)
2. **Same group IDs**: Point to the exact same Azure AD security groups as this app
3. **Same deployment approach**: Docker + NGINX + Google Cloud Run
4. **Same CORS handling**: NGINX reverse proxy for Interact API

---

## Implementation Steps

### Step 1: Review the Complete Guide

Read the comprehensive guide: [AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md](./AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md)

This contains:
- Full authentication implementation (all files)
- Deployment setup (Docker, NGINX, Google Cloud)
- Configuration reference
- Troubleshooting guide

### Step 2: Use These Exact Values

#### Azure AD Configuration

```typescript
// From auth/authConfig.ts in this app
MSAL_CLIENT_ID = "5fa64631-ea56-4676-b6d5-433d322a4da1";
MSAL_TENANT_ID = "d026e4c1-5892-497a-b9da-ee493c9f0364";

// General access group (all users)
REQUIRED_GROUP_ID = "2c08b5d8-7def-4845-a48c-740b987dcffb";  // MOM WW All Users 1 SG

// Admin group (settings access)
ADMIN_GROUP_ID = "1322ab5f-d86d-4c9e-b863-fba031615857";  // MOM Tech Admin Users SG
```

### Step 3: Copy These Files

From the Meeting Notes Generator app, copy and adapt these files to the target app:

#### Authentication Files (copy structure, adapt branding)

```
auth/
├── authConfig.ts          → Configure with values above
├── AuthGuard.tsx          → Main authentication logic (copy exactly)
├── SignInPage.tsx         → Update branding/text only
└── AccessDenied.tsx       → Update branding/text only

contexts/
└── AuthContext.tsx        → Copy exactly

types.ts                   → Add GraphData interface
```

#### Deployment Files (copy and update variables)

```
Dockerfile                 → Copy, update ENV vars for your app
nginx.conf                 → Copy exactly (handles CORS for Interact API)
build-and-push.ps1        → Copy, update PROJECT_ID, REPOSITORY_NAME, IMAGE_NAME
build-push-image.sh       → Copy, update PROJECT_ID, REPOSITORY_NAME, IMAGE_NAME
vite.config.ts            → Copy proxy configuration
```

### Step 4: Install Dependencies

Add to package.json:

```json
{
  "dependencies": {
    "@azure/msal-browser": "^3.30.0",
    "@azure/msal-react": "^2.2.0"
  }
}
```

Run:
```bash
npm install
```

### Step 5: Update App.tsx

Wrap your main app with AuthGuard:

```typescript
import { AuthGuard } from './auth/AuthGuard';

function App() {
  return (
    <AuthGuard>
      <YourMainApp />
    </AuthGuard>
  );
}
```

### Step 6: Use Auth in Components

```typescript
import { useAuth } from './contexts/AuthContext';

function YourComponent() {
  const { user, graphData, isAdmin, logout } = useAuth();

  // Conditional rendering based on admin status
  {isAdmin && <SettingsButton />}

  return (
    // Your component
  );
}
```

### Step 7: Google Cloud Setup

#### Create Artifact Registry Repository

```bash
gcloud artifacts repositories create your-app-name \
    --repository-format=docker \
    --location=us-east4 \
    --description="Your app Docker images"
```

#### Update Build Scripts

In `build-and-push.ps1` and `build-push-image.sh`:

```bash
PROJECT_ID="mom-ai-apps"                    # Same project as Meeting Notes app
REPOSITORY_NAME="your-repository-name"     # The repository you just created
IMAGE_NAME="your-app-name"                 # Your app's Docker image name
REGION="us-east4"                          # Same region
```

### Step 8: Build and Deploy

#### Build and Push Docker Image

PowerShell:
```powershell
./build-and-push.ps1
```

Or Git Bash:
```bash
./build-push-image.sh
```

#### Deploy to Cloud Run

```bash
gcloud run deploy your-app-name \
    --image us-east4-docker.pkg.dev/mom-ai-apps/your-repo/your-app:latest \
    --platform managed \
    --region us-east4 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --min-instances 0 \
    --max-instances 10
```

### Step 9: Update Azure AD Redirect URIs

1. Get Cloud Run URL from deployment output
2. Go to Azure Portal → App Registrations
3. Find the app with Client ID: `5fa64631-ea56-4676-b6d5-433d322a4da1`
4. Go to Authentication → Add redirect URI
5. Add both:
   - `http://localhost:5173` (for local dev)
   - `https://your-app-name-xxx.run.app` (Cloud Run URL)
6. Save

---

## Key Differences from Meeting Notes App

### What Stays the Same

✅ All authentication logic (AuthGuard, AuthContext, group checking)
✅ Azure AD configuration (Client ID, Tenant ID, Group IDs)
✅ Docker + NGINX setup
✅ Google Cloud deployment approach
✅ CORS handling via NGINX reverse proxy

### What Changes

🔧 App branding (name, logo, colors) in SignInPage and AccessDenied
🔧 Google Cloud repository name and image name
🔧 App-specific environment variables (if any)
🔧 App-specific features that use the `isAdmin` flag

---

## Validation Checklist

After implementation, verify:

- [ ] Authentication works locally (redirects to Microsoft login)
- [ ] Group-based access control works (only authorized users can access)
- [ ] Admin-only features only show for admin group members
- [ ] Local development proxy works (API calls go through `/api/`)
- [ ] Docker image builds successfully
- [ ] Image pushes to Google Artifact Registry
- [ ] Cloud Run deployment succeeds
- [ ] Production app loads and authentication works
- [ ] CORS issues are resolved (NGINX proxy working)
- [ ] Azure AD redirect URIs are registered for both localhost and production

---

## Conversation Context from Nick (Deployment Discussion)

### Key Points from Transcript

1. **CORS Solution**: Use NGINX reverse proxy to make requests server-to-server instead of browser-to-server
   - Interact API doesn't allow cross-origin requests from browsers
   - NGINX removes browser headers (Origin, Referer) making it look like a server request

2. **Deployment Architecture**:
   - Single Cloud Run service (frontend + NGINX)
   - No separate backend needed
   - NGINX serves static files + proxies API requests

3. **Windows Setup**:
   - Requires WSL2 for Docker on Windows
   - Use PowerShell with admin privileges
   - Google Cloud CLI installation required

4. **Development vs Production**:
   - Local: Vite proxy handles CORS
   - Production: NGINX proxy handles CORS
   - Same behavior, different implementation

5. **Environment Variables**:
   - Use `.env` file locally (in `.gitignore`)
   - Set in Cloud Run console for production
   - Can be passed to Docker build as build args

6. **Artifact Registry**:
   - One repository per app
   - Use `:latest` tag for simplicity
   - Located in same region as Cloud Run (us-east4)

---

## Quick Reference Commands

### Docker

```bash
# Check Docker version
docker version

# Build image locally
docker build -t my-app:latest .

# Run locally
docker run -p 8080:8080 my-app:latest
```

### Google Cloud

```bash
# Authenticate
gcloud auth login

# Configure Docker for Artifact Registry
gcloud auth configure-docker us-east4-docker.pkg.dev

# List Cloud Run services
gcloud run services list --region us-east4

# View Cloud Run logs
gcloud run services logs read your-app-name --region us-east4
```

### Git

```bash
# Initialize repo (if needed)
git init

# Add files
git add .

# Commit
git commit -m "Add authentication and deployment setup"
```

---

## Support

If issues arise during implementation:

1. Check the full guide: [AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md](./AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md)
2. Review the source files in this app (Meeting Notes Generator)
3. Check Cloud Run logs for deployment issues
4. Verify Azure AD group memberships in Azure Portal

---

## File References from This App

**Full implementations to reference:**

- [auth/authConfig.ts](../auth/authConfig.ts) - Azure AD configuration
- [auth/AuthGuard.tsx](../auth/AuthGuard.tsx) - Main authentication logic
- [contexts/AuthContext.tsx](../contexts/AuthContext.tsx) - Auth context
- [Dockerfile](../Dockerfile) - Docker build configuration
- [nginx.conf](../nginx.conf) - NGINX configuration for CORS
- [build-and-push.ps1](../build-and-push.ps1) - PowerShell build script
- [build-push-image.sh](../build-push-image.sh) - Bash build script
- [vite.config.ts](../vite.config.ts) - Vite dev server proxy configuration

---

**END OF QUICK START**

You now have everything needed to implement the same authentication and deployment setup in your other application. Follow the comprehensive guide for detailed instructions on each step.
