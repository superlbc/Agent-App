# Complete MSAL Authentication & Google Cloud Deployment Guide

This guide provides step-by-step instructions to implement Azure AD (MSAL) authentication with group-based access control and deploy to Google Cloud Run with NGINX reverse proxy.

**Target Use Case:** Replicate the authentication and deployment setup from the Meeting Notes Generator app to any other React/Vite application with the same structure.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Authentication Implementation](#authentication-implementation)
3. [Deployment Setup](#deployment-setup)
4. [Production Deployment](#production-deployment)
5. [Configuration Reference](#configuration-reference)

---

## Prerequisites

### Azure AD Requirements
- Azure AD tenant access
- Two Azure AD security groups created:
  - **General Access Group**: For all users who can access the app
  - **Admin Group**: For users with admin/settings access
- Azure AD App Registration with:
  - Client ID
  - Tenant ID
  - Redirect URIs registered (localhost for dev, Cloud Run URL for prod)
  - API permissions: `User.Read`, `User.ReadBasic.All`, `Presence.Read.All`, `profile`
  - **CRITICAL**: Token configuration must include "groups" claim in ID tokens

### Development Environment (Windows)
- Node.js 18+ installed
- Docker Desktop installed
- WSL2 installed (for Docker on Windows)
- Google Cloud CLI installed
- Git installed
- Admin privileges on local machine

### Google Cloud Requirements
- GCP project created
- Billing enabled on project
- Artifact Registry API enabled
- Cloud Run API enabled
- Appropriate IAM permissions (Editor or Cloud Run Admin)

---

## Authentication Implementation

### Step 1: Install Dependencies

Add the required packages to your `package.json`:

```json
{
  "dependencies": {
    "@azure/msal-browser": "^3.30.0",
    "@azure/msal-react": "^2.2.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  }
}
```

Run:
```bash
npm install
```

### Step 2: Create Authentication Configuration

Create `auth/authConfig.ts`:

```typescript
import { PublicClientApplication, Configuration, LogLevel } from "@azure/msal-browser";

export const getRedirectUri = (): string => {
    // Fully dynamic - uses the current origin (protocol + hostname + port)
    // Works for localhost, Cloud Run, and any future deployment URLs
    // IMPORTANT: All redirect URIs must be registered in Azure AD app registration
    return window.location.origin;
};

// IMPORTANT: Replace these with your Azure AD values
const MSAL_CLIENT_ID = "YOUR-CLIENT-ID-HERE";
const MSAL_TENANT_ID = "YOUR-TENANT-ID-HERE";

// Azure AD Security Group for general app access
// Group Name: "Your App All Users SG" (example)
// IMPORTANT: Replace with your actual group ID
export const REQUIRED_GROUP_ID = "YOUR-GENERAL-ACCESS-GROUP-ID-HERE";

// Azure AD Security Group for Admin users (Settings Access)
// TODO: Replace with actual admin security group ID when created
// Currently using the same group as REQUIRED_GROUP_ID as a placeholder
export const ADMIN_GROUP_ID = "YOUR-ADMIN-GROUP-ID-HERE";

export const msalConfig: Configuration = {
    auth: {
        clientId: MSAL_CLIENT_ID,
        authority: `https://login.microsoftonline.com/${MSAL_TENANT_ID}`,
        redirectUri: getRedirectUri(),
    },
    cache: {
        cacheLocation: "sessionStorage",
        storeAuthStateInCookie: false,
    },
    system: {
        loggerOptions: {
            loggerCallback: (level, message, containsPii) => {
                if (containsPii) {
                    return;
                }
                switch (level) {
                    case LogLevel.Error:
                        console.error(message);
                        return;
                    case LogLevel.Info:
                        // console.info(message); // Uncomment for verbose logging
                        return;
                    case LogLevel.Verbose:
                        // console.debug(message); // Uncomment for verbose logging
                        return;
                    case LogLevel.Warning:
                        console.warn(message);
                        return;
                }
            }
        }
    }
};

export const msalInstance = new PublicClientApplication(msalConfig);

// API permissions required
export const loginRequest = {
    scopes: ["User.Read", "User.ReadBasic.All", "Presence.Read.All", "profile"]
};

export const graphConfig = {
    graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
    graphMePhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value"
};
```

### Step 3: Create Type Definitions

Create or update `types.ts`:

```typescript
export interface GraphData {
  id?: string;
  displayName?: string;
  jobTitle?: string;
  department?: string;
  companyName?: string;
  officeLocation?: string;
  mail?: string;
  photoUrl?: string;
}
```

### Step 4: Create Authentication Context

Create `contexts/AuthContext.tsx`:

```typescript
import { createContext, useContext } from 'react';
import { AccountInfo } from "@azure/msal-browser";
import { GraphData } from '../types';

interface AuthContextType {
  isAuthenticated: boolean;
  isAuthorized: boolean;
  isAdmin: boolean;
  user: AccountInfo | null;
  graphData: GraphData | null;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
```

### Step 5: Create AuthGuard Component

Create `auth/AuthGuard.tsx` (THIS IS THE MAIN AUTHENTICATION LOGIC):

```typescript
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MsalProvider, useMsal, useIsAuthenticated } from "@azure/msal-react";
import { BrowserAuthError, AccountInfo } from "@azure/msal-browser";
import { msalInstance, loginRequest, graphConfig, getRedirectUri, REQUIRED_GROUP_ID, ADMIN_GROUP_ID } from './authConfig';
import { AuthContext } from '../contexts/AuthContext';
import { GraphData } from '../types';
import { SignInPage } from './SignInPage';
import { LoadingModal } from '../components/ui/LoadingModal';
import { AccessDenied } from './AccessDenied';

// Check if running in AI Studio or iframe (for dev/demo mode)
const isInAiStudio = () => {
    try {
        if ((window as any).google?.aistudio?.inAiStudio) {
            return true;
        }
        return window.self !== window.top;
    } catch (e) {
        return true;
    }
};

// Mock authentication for development/demo environments
const MockAuthenticatedApp: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const accounts = msalInstance.getAllAccounts();
    const realAccount = accounts.length > 0 ? accounts[0] : null;

    const devEmail = realAccount ? `${realAccount.username}` : 'dev-user@localhost.com';
    const devName = realAccount ? `${realAccount.name || 'Dev User'} (Dev)` : 'Dev User (Local)';

    const mockUser: AccountInfo = {
        homeAccountId: realAccount?.homeAccountId || 'mock-home-account-id',
        environment: realAccount?.environment || 'mock-env',
        tenantId: realAccount?.tenantId || 'mock-tenant-id',
        username: devEmail,
        localAccountId: realAccount?.localAccountId || 'mock-local-account-id',
        name: devName,
    };

    const mockGraphData: GraphData = {
        displayName: devName,
        jobTitle: realAccount ? 'Development Mode' : 'Developer',
        mail: devEmail,
    };

    return (
        <AuthContext.Provider value={{
            isAuthenticated: true,
            isAuthorized: true,
            isAdmin: true,
            user: mockUser,
            graphData: mockGraphData,
            logout: () => console.log("Mock logout")
        }}>
            {children}
        </AuthContext.Provider>
    );
};

// Helper function to check if user is in the required Azure AD group
const checkGroupMembership = (account: AccountInfo | null): boolean => {
    if (!account) return false;

    const claims = account.idTokenClaims as any;

    if (claims && claims.groups && Array.isArray(claims.groups)) {
        const isMember = claims.groups.includes(REQUIRED_GROUP_ID);
        console.log('Group membership check:', {
            userEmail: account.username,
            requiredGroup: REQUIRED_GROUP_ID,
            userGroups: claims.groups,
            isMember
        });

        return isMember;
    }

    console.warn('Groups claim not found in token. User access denied by default.');
    return false;
};

// Helper function to check if user is in the admin Azure AD group (for settings access)
const checkAdminMembership = (account: AccountInfo | null): boolean => {
    if (!account) return false;

    const claims = account.idTokenClaims as any;

    if (claims && claims.groups && Array.isArray(claims.groups)) {
        const isAdmin = claims.groups.includes(ADMIN_GROUP_ID);
        console.log('Admin membership check:', {
            userEmail: account.username,
            adminGroup: ADMIN_GROUP_ID,
            userGroups: claims.groups,
            isAdmin
        });

        return isAdmin;
    }

    console.warn('Groups claim not found in token. Admin access denied by default.');
    return false;
};

const AuthenticatedAppController: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { instance, accounts } = useMsal();
    const isAuthenticated = useIsAuthenticated();
    const [graphData, setGraphData] = useState<GraphData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [popupBlocked, setPopupBlocked] = useState(false);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const hasFetchedGraphData = useRef(false);

    const handleLogin = useCallback(() => {
        setPopupBlocked(false);
        // Use popup for iframes (like AI Studio) and redirect for top-level windows
        const authMethod = window.self !== window.top
            ? instance.loginPopup(loginRequest)
            : instance.loginRedirect(loginRequest);

        authMethod.catch(error => {
            if (error instanceof BrowserAuthError && (error.errorCode === "popup_window_error" || error.errorCode === "monitor_window_timeout")) {
                console.warn("Login popup blocked, showing fallback.", error);
                setPopupBlocked(true);
            } else {
                console.error("Login failed:", error);
            }
        });
    }, [instance]);

    const handleLogout = useCallback(() => {
        if (window.self !== window.top) {
            instance.logoutPopup({ postLogoutRedirectUri: "/" });
        } else {
            instance.logoutRedirect({ postLogoutRedirectUri: "/" });
        }
    }, [instance]);

    useEffect(() => {
        if (isAuthenticated && accounts.length > 0 && !hasFetchedGraphData.current) {
            hasFetchedGraphData.current = true;
            setIsLoading(true);

            // Check group membership first
            const authorized = checkGroupMembership(accounts[0]);
            setIsAuthorized(authorized);

            // Check admin membership (for settings access)
            const admin = checkAdminMembership(accounts[0]);
            setIsAdmin(admin);

            // If not authorized, stop here - don't fetch Graph data
            if (!authorized) {
                setIsLoading(false);
                console.warn('User is not authorized to access this application.');
                return;
            }

            // User is authorized, proceed with fetching Graph data
            instance.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0]
            }).then(response => {
                const headers = { Authorization: `Bearer ${response.accessToken}` };
                const fetchProfile = fetch(graphConfig.graphMeEndpoint, { headers }).then(res => res.json());
                const fetchPhoto = fetch(graphConfig.graphMePhotoEndpoint, { headers }).then(res => res.ok ? res.blob() : null);

                Promise.all([fetchProfile, fetchPhoto]).then(([profileData, photoBlob]) => {
                    const photoUrl = photoBlob ? URL.createObjectURL(photoBlob) : undefined;
                    setGraphData({
                        displayName: profileData.displayName,
                        jobTitle: profileData.jobTitle,
                        mail: profileData.mail,
                        photoUrl: photoUrl,
                    });
                }).catch(error => {
                    console.error("Failed to fetch graph data, using fallbacks:", error);
                    setGraphData({ displayName: accounts[0].name, mail: accounts[0].username });
                }).finally(() => {
                    setIsLoading(false);
                });
            }).catch(error => {
                console.error("Silent token acquisition failed:", error);
                setIsLoading(false);
                handleLogin();
            });
        } else if (!isAuthenticated) {
            setIsLoading(false);
        }
    }, [isAuthenticated, accounts, instance, handleLogin]);

    const contextValue = {
        isAuthenticated,
        isAuthorized,
        isAdmin,
        user: accounts[0] || null,
        graphData,
        logout: handleLogout
    };

    if (isLoading) {
        return <LoadingModal isOpen={true} title="Authenticating..." messages={[{ progress: 0, text: 'Verifying session...' }]} />;
    }

    return (
        <AuthContext.Provider value={contextValue}>
            {!isAuthenticated ? (
                <SignInPage onLogin={handleLogin} popupBlocked={popupBlocked} onOpenInNewTab={() => window.open(window.location.href, '_blank')} />
            ) : !isAuthorized ? (
                <AccessDenied userEmail={accounts[0]?.username} onSignOut={handleLogout} />
            ) : (
                children
            )}
        </AuthContext.Provider>
    );
};

export const AuthGuard: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    if (isInAiStudio()) {
        return <MockAuthenticatedApp>{children}</MockAuthenticatedApp>;
    }

    return (
        <MsalProvider instance={msalInstance}>
            <AuthenticatedAppController>{children}</AuthenticatedAppController>
        </MsalProvider>
    );
};
```

### Step 6: Create Sign In Page Component

Create `auth/SignInPage.tsx`:

```typescript
import React from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';

interface SignInPageProps {
  onLogin: () => void;
  popupBlocked: boolean;
  onOpenInNewTab: () => void;
}

export const SignInPage: React.FC<SignInPageProps> = ({ onLogin, popupBlocked, onOpenInNewTab }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
      <Card className="w-full max-w-md p-8 text-center relative">
        <span className="absolute top-4 right-4 text-xs font-semibold px-2 py-1 rounded bg-blue-500 text-white">Beta</span>
        <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />
        <div className="mt-6">
          <p className="text-sm text-slate-500 dark:text-slate-400 mb-2">Welcome to</p>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Your App Name
          </h1>
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400 italic">
            Your app tagline
          </p>
        </div>
        <p className="mt-6 text-slate-600 dark:text-slate-400">
          Sign in with your corporate account to continue
        </p>

        {!popupBlocked && (
          <Button size="lg" className="w-full mt-8" onClick={onLogin}>
            Sign in with Microsoft
          </Button>
        )}

        {popupBlocked && (
          <div className="mt-8 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800/50 rounded-lg text-left">
            <h2 className="font-semibold text-amber-800 dark:text-amber-200">
              Popup Blocked
            </h2>
            <p className="mt-1 text-sm text-amber-700 dark:text-amber-300">
              Please allow popups for this site or open in a new tab
            </p>
            <Button size="md" variant="outline" className="w-full mt-4" onClick={onOpenInNewTab}>
              <Icon name="external-link" className="h-4 w-4 mr-2"/>
              Open in New Tab
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};
```

### Step 7: Create Access Denied Page Component

Create `auth/AccessDenied.tsx`:

```typescript
import React from 'react';
import { Button } from '../components/ui/Button';
import { Icon } from '../components/ui/Icon';
import { Card } from '../components/ui/Card';

interface AccessDeniedProps {
    userEmail?: string;
    onSignOut: () => void;
}

export const AccessDenied: React.FC<AccessDeniedProps> = ({ userEmail, onSignOut }) => {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-900">
            <Card className="w-full max-w-md p-8 text-center">
                <Icon name="logo" className="h-20 w-20 text-primary mx-auto" />

                {/* Access Restricted Icon */}
                <div className="mt-6 flex items-center justify-center">
                    <div className="relative">
                        <svg
                            className="h-16 w-16 text-red-500 dark:text-red-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <circle cx="12" cy="12" r="10" strokeWidth="2" />
                            <line x1="4.93" y1="4.93" x2="19.07" y2="19.07" strokeWidth="2" />
                        </svg>
                    </div>
                </div>

                <h1 className="mt-6 text-3xl font-bold text-slate-900 dark:text-white">
                    Access Restricted
                </h1>

                <p className="mt-4 text-slate-600 dark:text-slate-400">
                    You are not authorized to access this application.
                </p>

                {userEmail && (
                    <div className="mt-6 p-4 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg">
                        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                            Signed in as:
                        </p>
                        <p className="mt-1 text-sm font-mono text-slate-900 dark:text-slate-100 break-all">
                            {userEmail}
                        </p>
                    </div>
                )}

                <p className="mt-6 text-sm text-slate-500 dark:text-slate-400">
                    Please contact your administrator for access.
                </p>

                <Button size="lg" className="w-full mt-8" onClick={onSignOut}>
                    Sign Out
                </Button>
            </Card>
        </div>
    );
};
```

### Step 8: Update App.tsx to Use AuthGuard

Wrap your main app with the AuthGuard:

```typescript
import { AuthGuard } from './auth/AuthGuard';
import { useAuth } from './contexts/AuthContext';

function App() {
  return (
    <AuthGuard>
      <YourMainApp />
    </AuthGuard>
  );
}

// In your components, use the auth hook:
function YourMainApp() {
  const { user, graphData, isAdmin, logout } = useAuth();

  // isAdmin can be used to conditionally show/hide admin features
  // Example: Only show settings button if user is admin
  {isAdmin && <SettingsButton />}

  return (
    // Your app content
  );
}
```

### Step 9: Conditional Feature Access (Admin-Only Features)

Example of hiding settings button from non-admin users:

```typescript
// In your Header or Menu component
const { isAdmin } = useAuth();

const menuItems = [
  { label: 'Dashboard', icon: 'home', action: () => {} },
  { label: 'Help', icon: 'help', action: () => {} },
  // Settings is only visible to admin users
  ...(isAdmin ? [{ label: 'Settings', icon: 'settings', action: () => {} }] : []),
];
```

---

## Deployment Setup

### Phase 1: Local Development Setup

#### 1.1 Install WSL2 (Windows only)

Open PowerShell as Administrator:

```powershell
wsl --install
```

Install Ubuntu 22.04:

```powershell
wsl --install -d Ubuntu-22.04
```

Restart your computer when prompted.

#### 1.2 Install Docker Desktop

1. Download Docker Desktop from https://www.docker.com/products/docker-desktop
2. Install and restart computer
3. Open Docker Desktop
4. Go to Settings → General
5. Ensure "Use the WSL 2 based engine" is enabled
6. Go to Settings → Resources → WSL Integration
7. Enable integration with your Ubuntu distribution

#### 1.3 Install Google Cloud CLI

Open PowerShell as Administrator:

```powershell
(New-Object Net.WebClient).DownloadFile("https://dl.google.com/dl/cloudsdk/channels/rapid/GoogleCloudSDKInstaller.exe", "$env:Temp\GoogleCloudSDKInstaller.exe")
& $env:Temp\GoogleCloudSDKInstaller.exe
```

Follow the installation wizard:
- Check all component options
- Include beta commands
- Install Cloud Tools for PowerShell

After installation, restart PowerShell and run:

```powershell
gcloud auth login
gcloud auth configure-docker us-east4-docker.pkg.dev
```

### Phase 2: Google Cloud Project Setup

#### 2.1 Enable Required APIs

In Google Cloud Console or via CLI:

```bash
gcloud services enable artifactregistry.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable compute.googleapis.com
```

#### 2.2 Create Artifact Registry Repository

Via Google Cloud Console:
1. Navigate to Artifact Registry
2. Click "CREATE REPOSITORY"
3. Settings:
   - Name: `your-app-name` (lowercase, hyphens only)
   - Format: Docker
   - Mode: Standard
   - Location type: Region
   - Region: `us-east4` (or your preferred region)
   - Encryption: Google-managed
4. Click CREATE

Via CLI:

```bash
gcloud artifacts repositories create your-app-name \
    --repository-format=docker \
    --location=us-east4 \
    --description="Your app Docker images"
```

### Phase 3: Docker Configuration

#### 3.1 Create Dockerfile

Create `Dockerfile` in your project root:

```dockerfile
# Build stage
FROM node:18-alpine as builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build arguments for environment variables
ARG GEMINI_API_KEY
ARG CLIENT_ID
ARG CLIENT_SECRET
ARG DEFAULT_BOT_ID

# Set environment variables (replace with your values or use secrets)
ENV GEMINI_API_KEY=PLACEHOLDER_API_KEY
ENV CLIENT_ID="YourClientID"
ENV CLIENT_SECRET="YourClientSecret"
ENV DEFAULT_BOT_ID="your-default-bot-id"

# Build the app
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx config
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

#### 3.2 Create NGINX Configuration (For CORS/Proxy)

Create `nginx.conf` in your project root:

**IMPORTANT**: This configuration is critical for handling CORS issues when calling the Interact API from the browser.

```nginx
events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript
               application/javascript application/xml+rss application/json;

    server {
        listen 8080;
        root /usr/share/nginx/html;
        index index.html;

        # Proxy /api requests to backend (Interact API)
        # This solves CORS issues by making the request server-to-server
        location /api/ {
            proxy_pass https://interact.interpublic.com/api/;
            proxy_ssl_server_name on;
            proxy_ssl_protocols TLSv1.2 TLSv1.3;

            # Critical: Remove ALL browser-related headers
            proxy_set_header Origin "";
            proxy_set_header Referer "";

            # Set headers to make it look like a server request
            proxy_set_header Host interact.interpublic.com;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_set_header X-Forwarded-Host $host;

            # Hide that this is a proxy
            proxy_hide_header Access-Control-Allow-Origin;
            proxy_hide_header Access-Control-Allow-Credentials;

            # Add CORS headers for the browser
            add_header Access-Control-Allow-Origin * always;
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
            add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
            add_header Access-Control-Max-Age 3600 always;

            # Handle preflight OPTIONS requests
            if ($request_method = 'OPTIONS') {
                add_header Access-Control-Allow-Origin * always;
                add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
                add_header Access-Control-Allow-Headers "Authorization, Content-Type, Accept" always;
                add_header Access-Control-Max-Age 3600 always;
                add_header Content-Length 0;
                add_header Content-Type text/plain;
                return 204;
            }

            # Timeouts
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;

            # Pass through the response
            proxy_buffering off;
        }

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
            try_files $uri =404;
        }

        # SPA fallback
        location / {
            try_files $uri $uri/ /index.html;
        }
    }
}
```

#### 3.3 Update vite.config.ts for Local Development

Your `vite.config.ts` should proxy API requests during development:

```typescript
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [react()],
    define: {
      'import.meta.env.CLIENT_ID': JSON.stringify(env.CLIENT_ID),
      'import.meta.env.CLIENT_SECRET': JSON.stringify(env.CLIENT_SECRET),
      'import.meta.env.DEFAULT_BOT_ID': JSON.stringify(env.DEFAULT_BOT_ID),
    },
    server: {
      port: 5173,
      proxy: {
        // everything under /api → https://interact.interpublic.com
        '/api': {
          target: 'https://interact.interpublic.com',
          changeOrigin: true,
          secure: true,
          // Remove browser Origin header so the upstream WAF treats it like a server-to-server call
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              proxyReq.removeHeader('origin')
            })
          },
        },
      },
    },
  }
})
```

### Phase 4: Build and Push Scripts

#### 4.1 Create PowerShell Script

Create `build-and-push.ps1`:

```powershell
# Run command "./build-and-push.ps1"

# Variables - CUSTOMIZE THESE
$IMAGE_NAME = "your-app-name"
$PROJECT_ID = "your-gcp-project-id"
$REGION = "us-east4"
$REPOSITORY_NAME = "your-repository-name"

$REGISTRY_URL = "$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME"
$REPOSITORY = "$REGISTRY_URL/$IMAGE_NAME"
$TAG_LATEST = "${REPOSITORY}:latest"

Write-Host "Building Docker image with tags: $TAG_LATEST" -ForegroundColor Green
docker build -t "$TAG_LATEST" .

Write-Host "Pushing images to registry" -ForegroundColor Green
docker push "$TAG_LATEST"

Write-Host "Docker image built and pushed successfully." -ForegroundColor Green
Write-Host ""
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "✅ Success!" -ForegroundColor Green
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host "Docker image built and pushed successfully"
Write-Host ""
Write-Host "To deploy to Cloud Run:" -ForegroundColor Yellow
Write-Host "  gcloud run deploy $IMAGE_NAME \"
Write-Host "    --image $TAG_LATEST \"
Write-Host "    --platform managed \"
Write-Host "    --region $REGION \"
Write-Host "=========================================" -ForegroundColor Cyan
```

#### 4.2 Create Bash Script (for Git Bash/WSL)

Create `build-push-image.sh`:

```bash
#!/bin/bash

# Variables - CUSTOMIZE THESE
IMAGE_NAME="your-app-name"
PROJECT_ID="your-gcp-project-id"
REGION="us-east4"
REPOSITORY_NAME="your-repository-name"

REGISTRY_URL="$REGION-docker.pkg.dev/$PROJECT_ID/$REPOSITORY_NAME"
REPOSITORY="${REGISTRY_URL}/${IMAGE_NAME}"
TAG_LATEST="${REPOSITORY}:latest"

echo "Building Docker image with tags: ${TAG_LATEST}"
docker build -t "${TAG_LATEST}" .

echo "========================================="
echo "Pushing images to registry"
echo "========================================="
docker push "${REPOSITORY}" --all-tags

echo ""
echo "========================================="
echo "✅ Success!"
echo "========================================="
echo "Docker image built and pushed successfully"
echo ""
echo "To deploy to Cloud Run:"
echo "  gcloud run deploy $IMAGE_NAME \\"
echo "    --image ${TAG_LATEST} \\"
echo "    --platform managed \\"
echo "    --region $REGION \\"
echo "========================================="
```

Make it executable:

```bash
chmod +x build-push-image.sh
```

---

## Production Deployment

### Step 1: Build and Push Docker Image

From PowerShell (in project directory):

```powershell
./build-and-push.ps1
```

Or from Git Bash/WSL:

```bash
./build-push-image.sh
```

### Step 2: Deploy to Cloud Run

#### Option A: Via Google Cloud Console (GUI)

1. Go to Cloud Run in Google Cloud Console
2. Click "CREATE SERVICE"
3. Select "Deploy one revision from an existing container image"
4. Click "SELECT" and choose your image from Artifact Registry
5. Service settings:
   - Service name: `your-app-name`
   - Region: `us-east4`
   - CPU allocation: "CPU is only allocated during request processing"
   - Autoscaling: Min instances: 0, Max instances: 10
   - Authentication: "Allow unauthenticated invocations" (Azure AD handles auth)
6. Container settings:
   - Port: 8080
   - Memory: 512 MiB (adjust as needed)
   - CPU: 1
7. Click "CREATE"

#### Option B: Via CLI

```bash
gcloud run deploy your-app-name \
    --image us-east4-docker.pkg.dev/your-project-id/your-repo/your-app:latest \
    --platform managed \
    --region us-east4 \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 10
```

### Step 3: Configure Environment Variables (Optional)

If you need to set environment variables in Cloud Run:

Via Console:
1. Go to your Cloud Run service
2. Click "EDIT & DEPLOY NEW REVISION"
3. Go to "Variables & Secrets" tab
4. Add environment variables

Via CLI:

```bash
gcloud run services update your-app-name \
    --region us-east4 \
    --set-env-vars "KEY1=value1,KEY2=value2"
```

### Step 4: Update Azure AD Redirect URIs

1. Copy the Cloud Run service URL (e.g., `https://your-app-name-abc123-uc.a.run.app`)
2. Go to Azure Portal → Azure Active Directory → App Registrations
3. Find your app registration
4. Go to Authentication → Redirect URIs
5. Add the Cloud Run URL as a new Single-page application redirect URI
6. Click "Save"

### Step 5: Custom Domain Setup (Optional)

To use a custom domain instead of the Cloud Run URL:

1. Go to Cloud Run → Your service → "MANAGE CUSTOM DOMAINS"
2. Click "ADD MAPPING"
3. Select your service
4. Enter your domain (e.g., `your-app.yourdomain.com`)
5. Follow instructions to update DNS records
6. Cloud Run will automatically provision SSL certificate

Update Azure AD redirect URIs with the custom domain.

---

## Configuration Reference

### Environment Variables

#### Local Development (.env file)

Create `.env` in your project root:

```env
CLIENT_ID=your-interact-client-id
CLIENT_SECRET=your-interact-client-secret
DEFAULT_BOT_ID=your-default-bot-id
GEMINI_API_KEY=your-gemini-api-key
```

**IMPORTANT**: Add `.env` to `.gitignore` to prevent committing secrets.

#### Production (Cloud Run)

Set environment variables via Cloud Run console or CLI as shown in Step 3 of Production Deployment.

### Azure AD Group IDs

Replace these values in `auth/authConfig.ts`:

```typescript
// General access group (all users who can use the app)
export const REQUIRED_GROUP_ID = "your-group-id-here";

// Admin group (users who can access admin features like settings)
export const ADMIN_GROUP_ID = "your-admin-group-id-here";
```

**How to get Group IDs from Azure AD:**

1. Go to Azure Portal → Azure Active Directory → Groups
2. Find your group
3. Copy the "Object ID" - this is your group ID

### Google Cloud Project Variables

Update these in your build scripts:

```bash
PROJECT_ID="your-gcp-project-id"        # e.g., "mom-ai-apps"
REGION="us-east4"                        # or your preferred region
REPOSITORY_NAME="your-repository-name"  # e.g., "meeting-notes-generator"
IMAGE_NAME="your-app-name"               # e.g., "momentum-meeting-notes"
```

---

## Troubleshooting

### Docker Issues

**Problem**: "Docker command not found" in PowerShell

**Solution**:
1. Ensure Docker Desktop is running
2. Restart PowerShell
3. If still not found, reinstall Docker Desktop

**Problem**: "Cannot connect to Docker daemon"

**Solution**:
1. Open Docker Desktop
2. Ensure WSL2 integration is enabled in settings
3. Restart Docker Desktop

### Authentication Issues

**Problem**: "Groups claim not found in token"

**Solution**:
1. Go to Azure Portal → App Registrations → Your app
2. Go to "Token configuration"
3. Add "groups" claim to ID tokens
4. Have users sign out and sign back in

**Problem**: User can authenticate but is denied access

**Solution**:
1. Verify the user is in the correct Azure AD security group
2. Check console logs for group membership details
3. Verify `REQUIRED_GROUP_ID` matches the actual group object ID

### Deployment Issues

**Problem**: Cloud Run returns 502 or 503 errors

**Solution**:
1. Check that your app listens on port 8080
2. Verify NGINX configuration is correct
3. Check Cloud Run logs for errors

**Problem**: CORS errors in production

**Solution**:
1. Verify nginx.conf is copied to the container
2. Check that API calls go through `/api/` path
3. Ensure Interact API credentials are correct

### Build Issues

**Problem**: npm build fails during Docker build

**Solution**:
1. Test build locally first: `npm run build`
2. Ensure all dependencies are in package.json
3. Check for environment variable issues

---

## Development vs Production Differences

### Local Development
- Uses Vite dev server with proxy
- Hot module reloading enabled
- Runs on http://localhost:5173
- Mock auth available in AI Studio / iframe environments

### Production
- Serves static built files via NGINX
- NGINX handles API proxying for CORS
- Runs on https://your-app.run.app (Cloud Run URL)
- Full Azure AD authentication required

---

## Security Best Practices

1. **Never commit secrets**: Always use `.env` files locally and environment variables in production
2. **Restrict Azure AD groups**: Only add authorized users to access groups
3. **Use separate admin groups**: Don't give everyone admin access
4. **Enable HTTPS**: Cloud Run provides this automatically
5. **Monitor access logs**: Check Cloud Run logs regularly
6. **Rotate secrets**: Periodically update API keys and secrets
7. **Limit Cloud Run permissions**: Use least-privilege IAM roles

---

## Next Steps After Implementation

1. **Set up monitoring**: Configure Cloud Run alerts for errors/high latency
2. **Create dev environment**: Deploy a separate dev instance for testing
3. **Configure load balancer**: If needed for internal-only access
4. **Set up CI/CD**: Automate builds and deployments with Cloud Build
5. **Add telemetry**: Track user actions and errors
6. **Document custom features**: Add app-specific documentation

---

## Support and Resources

- **MSAL Documentation**: https://docs.microsoft.com/en-us/azure/active-directory/develop/msal-overview
- **Cloud Run Documentation**: https://cloud.google.com/run/docs
- **Docker Documentation**: https://docs.docker.com/
- **NGINX Documentation**: https://nginx.org/en/docs/

---

## Change Log

When you implement this in your new application, update these values in the relevant files:

### Required Changes Checklist:

- [ ] `auth/authConfig.ts`: Update `MSAL_CLIENT_ID`, `MSAL_TENANT_ID`
- [ ] `auth/authConfig.ts`: Update `REQUIRED_GROUP_ID` and `ADMIN_GROUP_ID`
- [ ] `build-and-push.ps1`: Update `PROJECT_ID`, `REPOSITORY_NAME`, `IMAGE_NAME`
- [ ] `build-push-image.sh`: Update `PROJECT_ID`, `REPOSITORY_NAME`, `IMAGE_NAME`
- [ ] `Dockerfile`: Update environment variables for your app
- [ ] `nginx.conf`: Update proxy target if not using Interact API
- [ ] `auth/SignInPage.tsx`: Update app name and branding
- [ ] Azure AD: Register redirect URIs for both localhost and production
- [ ] Google Cloud: Create Artifact Registry repository
- [ ] Google Cloud: Enable required APIs (Cloud Run, Artifact Registry)

---

**END OF GUIDE**

This guide provides everything needed to replicate the Meeting Notes Generator authentication and deployment setup in any React/Vite application with the same structure.
