# Claude Code Implementation Prompt

**Copy and paste this entire document into Claude Code when working on your other application.**

---

## Task: Implement MSAL Authentication and Google Cloud Deployment

I need you to implement Azure AD (MSAL) authentication with group-based access control and Google Cloud Run deployment in this React/Vite application. The implementation should be identical to the reference application (Meeting Notes Generator).

### Reference Documentation

I have two comprehensive guides from the reference application:
1. **AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md** - Complete implementation guide
2. **QUICK-START-FOR-CLAUDE-CODE.md** - Quick reference

Please read both documents before starting implementation.

---

## Implementation Requirements

### 1. Authentication Setup

Implement the following authentication system:

**Azure AD Configuration:**
```typescript
MSAL_CLIENT_ID = "5fa64631-ea56-4676-b6d5-433d322a4da1"
MSAL_TENANT_ID = "d026e4c1-5892-497a-b9da-ee493c9f0364"
REQUIRED_GROUP_ID = "2c08b5d8-7def-4845-a48c-740b987dcffb"  // General access (MOM WW All Users 1 SG)
ADMIN_GROUP_ID = "1322ab5f-d86d-4c9e-b863-fba031615857"     // Admin access (MOM Tech Admin Users SG)
```

**Files to Create:**
- `auth/authConfig.ts` - Azure AD configuration
- `auth/AuthGuard.tsx` - Main authentication logic with group checking
- `auth/SignInPage.tsx` - Sign-in page component
- `auth/AccessDenied.tsx` - Access denied page component
- `contexts/AuthContext.tsx` - Authentication context

**Key Features:**
- Azure AD authentication using MSAL
- Group-based access control (check `REQUIRED_GROUP_ID` for app access)
- Admin-level features (check `ADMIN_GROUP_ID` for admin features)
- Mock authentication for development environments
- Automatic Graph API integration for user profile and photo

**Dependencies to Install:**
```json
{
  "@azure/msal-browser": "^3.30.0",
  "@azure/msal-react": "^2.2.0"
}
```

### 2. Deployment Configuration

Create the following deployment files:

**Docker Configuration:**
- `Dockerfile` - Multi-stage build (Node.js build + NGINX production)
- `nginx.conf` - NGINX configuration with reverse proxy for CORS handling

**Build Scripts:**
- `build-and-push.ps1` - PowerShell script to build and push Docker image
- `build-push-image.sh` - Bash script to build and push Docker image

**CRITICAL**: The NGINX configuration must include a reverse proxy for `/api/` requests to handle CORS issues with the Interact API:
- Proxies `/api/*` to `https://interact.interpublic.com/api/*`
- Removes browser Origin and Referer headers
- Adds appropriate CORS headers
- Handles OPTIONS preflight requests

### 3. Local Development Setup

Update `vite.config.ts` to include proxy configuration for local development:
```typescript
server: {
  proxy: {
    '/api': {
      target: 'https://interact.interpublic.com',
      changeOrigin: true,
      secure: true,
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          proxyReq.removeHeader('origin')
        })
      },
    },
  },
}
```

### 4. Integration with Existing App

**Wrap App.tsx with AuthGuard:**
```typescript
import { AuthGuard } from './auth/AuthGuard';

function App() {
  return (
    <AuthGuard>
      <YourExistingApp />
    </AuthGuard>
  );
}
```

**Use Auth in Components:**
```typescript
import { useAuth } from './contexts/AuthContext';

function YourComponent() {
  const { user, graphData, isAdmin, logout } = useAuth();

  // Use isAdmin for conditional feature access
  {isAdmin && <AdminOnlyFeature />}
}
```

---

## Step-by-Step Implementation Plan

Please follow this order:

### Phase 1: Authentication
1. Read AUTHENTICATION-AND-DEPLOYMENT-GUIDE.md
2. Install required dependencies
3. Create `types.ts` with GraphData interface
4. Create `contexts/AuthContext.tsx`
5. Create `auth/authConfig.ts` with the exact values provided above
6. Create `auth/AuthGuard.tsx` - this is the core authentication logic
7. Create `auth/SignInPage.tsx` - update branding for this app
8. Create `auth/AccessDenied.tsx` - update branding for this app
9. Update `App.tsx` to wrap with AuthGuard
10. Test authentication locally

### Phase 2: Deployment Setup
1. Create `Dockerfile` with multi-stage build
2. Create `nginx.conf` with reverse proxy configuration
3. Create `build-and-push.ps1` (update variables for this app)
4. Create `build-push-image.sh` (update variables for this app)
5. Update `vite.config.ts` with proxy configuration
6. Test Docker build locally

### Phase 3: Documentation
1. Create `.env.example` file with required environment variables
2. Update README.md with setup instructions
3. Document any app-specific configuration changes

---

## Important Implementation Notes

### From AuthGuard.tsx

The AuthGuard component should:
1. Check if running in iframe/AI Studio (use mock auth for development)
2. Use MSAL for authentication (popup for iframes, redirect for top-level windows)
3. Check group membership from `idTokenClaims.groups` array
4. Set `isAuthenticated`, `isAuthorized`, and `isAdmin` flags
5. Fetch user profile and photo from Microsoft Graph API
6. Show appropriate UI based on auth state:
   - Not authenticated → SignInPage
   - Authenticated but not authorized → AccessDenied
   - Authenticated and authorized → Main app

### CORS Handling

**Local Development:**
- Vite dev server proxies `/api/*` requests
- Removes Origin header to bypass CORS

**Production:**
- NGINX proxies `/api/*` requests
- Removes Origin and Referer headers
- Adds CORS headers for browser
- Makes request appear as server-to-server

### Google Cloud Variables

When creating build scripts, use these values:

```bash
PROJECT_ID="mom-ai-apps"                    # Same project as reference app
REGION="us-east4"                          # Same region
REPOSITORY_NAME="[YOUR-NEW-REPO-NAME]"     # Create new repo for this app
IMAGE_NAME="[YOUR-APP-NAME]"               # Your app's Docker image name
```

Before deployment:
1. Create Artifact Registry repository:
```bash
gcloud artifacts repositories create [YOUR-REPO-NAME] \
    --repository-format=docker \
    --location=us-east4
```

2. Build and push:
```bash
./build-and-push.ps1  # or ./build-push-image.sh
```

3. Deploy to Cloud Run:
```bash
gcloud run deploy [YOUR-APP-NAME] \
    --image us-east4-docker.pkg.dev/mom-ai-apps/[YOUR-REPO]/[YOUR-APP]:latest \
    --region us-east4 \
    --allow-unauthenticated \
    --port 8080
```

4. Add Cloud Run URL to Azure AD redirect URIs

---

## Validation Checklist

After implementation, verify:

**Authentication:**
- [ ] User can sign in with Microsoft account
- [ ] Only users in `REQUIRED_GROUP_ID` can access the app
- [ ] Users not in group see "Access Denied" page
- [ ] User profile and photo display correctly
- [ ] Mock authentication works in development mode
- [ ] `isAdmin` flag correctly reflects `ADMIN_GROUP_ID` membership

**Development:**
- [ ] App runs locally with `npm run dev`
- [ ] Authentication works on localhost:5173
- [ ] API proxy works (no CORS errors in dev)
- [ ] Hot reload works correctly

**Deployment:**
- [ ] Docker image builds successfully
- [ ] Image pushes to Artifact Registry
- [ ] Cloud Run deployment succeeds
- [ ] Production app loads without errors
- [ ] Authentication works in production
- [ ] API proxy works (no CORS errors in production)
- [ ] NGINX serves static files correctly
- [ ] HTTPS works (automatic with Cloud Run)

**Configuration:**
- [ ] Azure AD redirect URIs registered for localhost and production
- [ ] Environment variables set correctly
- [ ] Build scripts have correct PROJECT_ID and REPOSITORY_NAME
- [ ] `.env` file in `.gitignore`

---

## Error Handling

If you encounter issues:

**"Groups claim not found in token":**
- Verify Azure AD app registration has "groups" claim in token configuration
- This should already be configured in the shared app registration

**CORS errors:**
- Verify NGINX proxy configuration is correct
- Check that API calls use `/api/` path
- Ensure nginx.conf is copied to Docker image

**Docker build fails:**
- Test build locally first: `npm run build`
- Check all dependencies are in package.json
- Verify Node version matches Dockerfile

**Cloud Run deployment fails:**
- Check that app listens on port 8080
- Verify image was pushed successfully
- Review Cloud Run logs for errors

---

## Questions to Ask Me

If anything is unclear, please ask:

1. App-specific branding (name, logo, tagline) for SignInPage and AccessDenied
2. Any app-specific environment variables beyond CLIENT_ID, CLIENT_SECRET, DEFAULT_BOT_ID
3. Google Cloud repository name to use
4. Docker image name to use
5. Whether this app needs admin-level features (to determine if isAdmin is used)

---

## Final Steps After Implementation

Once implementation is complete:

1. Show me the authentication flow working locally
2. Show me the Docker build output
3. Show me the Cloud Run deployment URL
4. Document any deviations from the reference implementation
5. Create a summary of all changes made

---

## Reference Files Available

If you need to see exact implementations, these files are available in the reference app:

- `auth/authConfig.ts`
- `auth/AuthGuard.tsx`
- `auth/SignInPage.tsx`
- `auth/AccessDenied.tsx`
- `contexts/AuthContext.tsx`
- `Dockerfile`
- `nginx.conf`
- `build-and-push.ps1`
- `build-push-image.sh`
- `vite.config.ts`
- `types.ts`

Please let me know if you need to see any of these files.

---

**BEGIN IMPLEMENTATION**

Please start by:
1. Confirming you understand the requirements
2. Reading the guide documents
3. Creating a task list of all files to create/modify
4. Implementing Phase 1 (Authentication)
5. Testing locally before moving to Phase 2

Let me know if you have any questions before starting!
