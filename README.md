# Meeting Notes Generator

> *Drive consistency and impact in every meeting.*

### 🚀 AI-Powered Meeting Notes Generation with Intelligent Insights

Transform raw meeting transcripts into professionally formatted meeting minutes with intelligent action item extraction, quality coaching, and flexible export options.

---

## 📋 Table of Contents

- [Overview](#overview)
- [✨ Features](#-features)
- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [How It Works](#how-it-works)
- [MSAL Authentication Setup](#msal-authentication-setup)
- [Configuration](#configuration)
- [API Documentation](#api-documentation)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [File Structure](#file-structure)
- [Development Notes](#development-notes)
- [Recent Changes](#recent-changes)
- [Version Information](#version-information)

---

## Overview

**Meeting Notes Generator** is a React-based web application that leverages AI to transform unstructured meeting transcripts into professional, actionable meeting minutes. The tool intelligently extracts action items, provides meeting quality insights through an optional "Meeting Coach" feature, and offers multiple formatting options tailored to different audiences (executive, cross-functional, department-specific).

### 🎯 Key Use Cases

- **Client-Facing Meetings**: Generate polished, redacted notes ready to share with clients
- **Internal Syncs**: Create detailed department-specific notes with critical analysis
- **Executive Briefings**: Produce concise, high-level summaries for leadership
- **Brainstorming Sessions**: Capture creative sessions with highlighted keywords and visual status indicators
- **Post-Meeting Analysis**: Use the "Meeting Coach" to identify facilitation improvements and meeting quality metrics

### 🏢 Target Users

- Project Managers tracking deliverables and action items
- Meeting facilitators seeking to improve meeting quality
- Executives needing quick meeting summaries
- Cross-functional teams coordinating complex initiatives
- Client-facing teams requiring polished documentation

---

## ✨ Features

### 🤖 AI-Powered Note Generation

✅ **Intelligent Summarization**
- Converts raw transcripts into structured narrative summaries
- Extracts key decisions, discussions, and outcomes
- Maintains context and conversation flow
- Generates markdown-formatted output with proper headings

✅ **Action Item Extraction**
- Automatically identifies tasks, owners, and due dates
- Organizes action items by department
- Includes status indicators (🟢 GREEN, 🟡 AMBER, 🔴 RED)
- Exports to CSV for project management tools

✅ **Meeting Coach Insights** 📊
- **Quality Metrics**: Agenda coverage, decision count, action count
- **Participant Analysis**: Diversity of speakers, participation balance
- **Facilitation Recommendations**: Actionable tips for future meetings
- **Red Flags Detection**: Unassigned actions, participation imbalances, few decisions
- **Coaching Styles**: Choose between gentle or direct feedback

### 🎨 Flexible Output Controls

✅ **View Modes**
- **Full Minutes**: Complete narrative + action items table
- **Actions-Only**: Quick reference for tasks and owners

✅ **Audience Targeting**
- **Executive**: High-level summaries, strategic focus
- **Cross-Functional**: Balanced detail, department context
- **Department-Specific**: Granular details, technical depth

✅ **Tone Options**
- **Professional**: Formal business language
- **Concise**: Bullet-point style, minimal prose
- **Client-Ready**: Polished, external-facing language

✅ **Advanced Formatting**
- **Department Focus**: Multi-select from 10+ departments (BL, STR, PM, CR, XD, XP, IPCT, etc.)
- **Critical Lens**: Enable analysis of gaps, risks, and unassigned actions
- **PII Redaction**: Auto-mask emails and phone numbers for client-facing notes
- **Visual Indicators**: Status icons (🟢🟡🔴) for quick scanning
- **Bold Keywords**: Highlight important terms automatically

### 📦 Meeting Presets

✅ **Client Update**
- Cross-functional audience + Client-ready tone
- Redaction enabled
- Gentle coaching style
- Context tag: "Client facing"

✅ **Internal Sync**
- Department-specific audience + Professional tone
- Critical lens enabled
- Direct coaching style
- Icons enabled for status visibility

✅ **Brainstorm**
- Cross-functional audience + Concise tone
- Bold keywords enabled
- Icons enabled
- No redaction

✅ **Executive Briefing**
- Executive audience + Concise tone
- Redaction enabled
- No coaching
- Context tag: "Executive review"

✅ **Custom**
- Build your own configuration
- Mix and match any options

### 💬 Interactive Transcript Interrogation

✅ **Ask Questions About Your Meeting**
- Chat-like interface for querying transcript content
- AI-generated suggested questions based on meeting context
- Follow-up question recommendations
- Real-time responses from the AI agent

### 📤 Export Capabilities

✅ **Multiple Export Formats**
- **CSV**: Action items table for Excel/project management tools
- **Email Draft**: Pre-formatted HTML email with meeting summary
- **PDF**: Print or save as PDF via browser print dialog
- **Clipboard**: Copy markdown text for Slack, Teams, or other tools

### 🎨 User Experience Features

✅ **Dark Mode Support** 🌙
- System preference detection
- Manual toggle
- Persistent preference storage

✅ **Interactive Guided Tour** 🗺️
- Step-by-step onboarding for new users
- Contextual highlights on key features
- Dismissible with "Don't show again" option

✅ **File Upload Support** 📁
- Upload `.txt` transcript files
- Upload `.docx` files (via Mammoth.js parsing)
- Drag-and-drop support

✅ **Form State Persistence** 💾
- Auto-save input data to localStorage
- Restore previous session on page reload
- Clear data button for fresh starts

✅ **Real-Time Preview** 👁️
- Output updates as you modify settings
- Live regeneration with control changes
- Loading states with skeleton loaders

✅ **Toast Notifications** 🔔
- Success/error feedback
- Auto-dismiss with timer
- Non-blocking UI

---

## Prerequisites

Before you begin, ensure you have the following installed and configured:

### Required Software

- **Node.js**: Version 18.x or higher
  - Download: [https://nodejs.org/](https://nodejs.org/)
  - Verify: `node --version`

- **npm**: Version 9.x or higher (included with Node.js)
  - Verify: `npm --version`

### Required Accounts & Access

- **Microsoft Entra ID (Azure AD) Account**: For user authentication
  - Your organization must have an Azure AD tenant
  - You'll need credentials to sign in (SSO supported)

- **API Access**: Credentials for Interact.interpublic.com API
  - Client ID: Provided by your IT/DevOps team
  - Client Secret: Provided by your IT/DevOps team
  - Bot ID: AI agent bot identifier for meeting notes generation

### Development Environment

- **Code Editor**: VS Code recommended (with React/TypeScript extensions)
- **Modern Browser**: Chrome, Edge, Firefox, or Safari (with developer tools)
- **Git**: For version control (optional but recommended)

---

## Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd "Momo Mettings App"
```

### 2. Install Dependencies

```bash
npm install
```

This will install:
- React 18.2.0 + React DOM
- TypeScript 5.4.5
- Vite 5.2.11 (build tool)
- MSAL Browser 3.10.0 (authentication)
- MSAL React 2.0.12 (React integration)
- Tailwind CSS (via CDN)

### 3. Configure Environment Variables

Create a `.env.local` file in the project root (copy from `.env.example`):

```bash
cp .env.example .env.local
```

Edit `.env.local` with your credentials:

```env
# API Credentials for Interact.interpublic.com
CLIENT_ID="YourClientID"
CLIENT_SECRET="YourClientSecret"

# Default Bot ID for AI Agent
DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"

# Google Gemini API Key (optional, not currently used)
GEMINI_API_KEY="PLACEHOLDER_API_KEY"
```

> ⚠️ **Security Note**: Never commit `.env.local` to version control. It's already in `.gitignore`.

### 4. Configure MSAL Authentication

Edit `auth/authConfig.ts` if you need to customize:

```typescript
export const msalConfig = {
  auth: {
    clientId: "5fa64631-ea56-4676-b6d5-433d322a4da1", // Your Azure AD App ID
    authority: "https://login.microsoftonline.com/{YOUR_TENANT_ID}",
    redirectUri: "http://localhost:5173", // Local development
  },
  cache: {
    cacheLocation: "sessionStorage",
  },
};
```

**Important**: Replace `{YOUR_TENANT_ID}` with your actual Azure AD tenant ID.

### 5. Run the Development Server

```bash
npm run dev
```

Expected output:
```
VITE v5.2.11  ready in 500 ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
```

### 6. Access the Application

Open your browser and navigate to: **http://localhost:5173**

You'll be prompted to sign in with your Microsoft account.

### 7. Test with Sample Data

Click the **"Load Sample Meeting"** button to populate the form with example data, then click **"Generate Meeting Notes"** to see the AI in action.

---

## How It Works

### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Browser                             │
│  ┌───────────────────────────────────────────────────────────┐ │
│  │           React Application (Port 5173)                    │ │
│  │                                                             │ │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │ │
│  │  │  Auth Guard  │  │ Input Panel  │  │  Output Panel   │ │ │
│  │  │   (MSAL)     │  │  (Form)      │  │  (Results)      │ │ │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │ │
│  │         │                  │                    │          │ │
│  │         │                  │                    │          │ │
│  │         ▼                  ▼                    ▼          │ │
│  │  ┌──────────────────────────────────────────────────────┐ │ │
│  │  │           Context API + State Management             │ │ │
│  │  │  (AuthContext, TourContext, useLocalStorage)         │ │ │
│  │  └──────────────────────────────────────────────────────┘ │ │
│  │                           │                                │ │
│  └───────────────────────────┼────────────────────────────────┘ │
│                              │                                  │
│                              ▼                                  │
│                   ┌──────────────────────┐                     │
│                   │  API Service Layer   │                     │
│                   │  (Token Management)  │                     │
│                   └──────────────────────┘                     │
└────────────────────────────────┼──────────────────────────────┘
                                 │
                                 │ HTTPS
                                 │
            ┌────────────────────┴──────────────────────┐
            │                                            │
            ▼                                            ▼
┌────────────────────────┐               ┌────────────────────────────┐
│  Microsoft Entra ID    │               │  Interact.interpublic.com  │
│  (Azure AD)            │               │  API                       │
│                        │               │                            │
│  - User Authentication │               │  - Token Endpoint          │
│  - Token Issuance      │               │  - Chat/AI Endpoint        │
│  - Profile Info        │               │  - Bot ID: {botId}         │
└────────────────────────┘               └────────────────────────────┘
            │                                            │
            ▼                                            ▼
┌────────────────────────┐               ┌────────────────────────────┐
│  Microsoft Graph API   │               │  AI Agent (Backend)        │
│                        │               │                            │
│  - GET /v1.0/me        │               │  - LLM Processing          │
│  - GET /me/photo/      │               │  - Meeting Analysis        │
│    $value              │               │  - Action Item Extraction  │
└────────────────────────┘               └────────────────────────────┘
```

### Authentication Flow

```
┌─────────┐                                           ┌──────────────┐
│ Browser │                                           │ Azure AD     │
└────┬────┘                                           └──────┬───────┘
     │                                                        │
     │  1. Check if user is authenticated                    │
     ├────────────────────────────────────┐                  │
     │                                    │                  │
     │  2a. Not authenticated             │                  │
     │  ───> Show sign-in UI              │                  │
     │                                    │                  │
     │  3. User clicks "Sign In"          │                  │
     │  ───> Trigger MSAL login           │                  │
     │                                    │                  │
     │  4. Popup vs. Redirect decision    │                  │
     │  (based on iframe detection)       │                  │
     │                                    │                  │
     │  5. Redirect to Azure AD           │                  │
     ├────────────────────────────────────┼─────────────────>│
     │                                    │                  │
     │  6. User enters credentials        │                  │
     │     (or SSO auto-login)            │                  │
     │                                    │                  │
     │  7. Azure AD returns auth code     │                  │
     │<───────────────────────────────────┼──────────────────┤
     │                                    │                  │
     │  8. MSAL exchanges code for token  │                  │
     ├────────────────────────────────────┼─────────────────>│
     │                                    │                  │
     │  9. Access token + ID token        │                  │
     │<───────────────────────────────────┼──────────────────┤
     │                                    │                  │
     │  10. Store token in sessionStorage │                  │
     │      Set auth context              │                  │
     │                                    │                  │
     │  2b. Already authenticated         │                  │
     │  ───> Load main app                │                  │
     │                                    │                  │
     ▼                                    ▼                  ▼
```

### API Request Flow

```
┌──────────────┐                                      ┌─────────────┐
│ React App    │                                      │ API Server  │
└──────┬───────┘                                      └──────┬──────┘
       │                                                     │
       │  1. User submits meeting form                      │
       ├──────────────────────────────────┐                 │
       │                                  │                 │
       │  2. Check if API token is valid  │                 │
       │     (check expiration)           │                 │
       │                                  │                 │
       │  3a. Token expired or missing    │                 │
       │  ───> Request new token          │                 │
       │                                  │                 │
       │  4. POST /api/token              │                 │
       │     Body: {                      │                 │
       │       client_id: "...",          │                 │
       │       client_secret: "...",      │                 │
       │       grant_type: "client_cred"  │                 │
       │     }                            │                 │
       ├──────────────────────────────────┼────────────────>│
       │                                  │                 │
       │  5. Return access_token          │                 │
       │<─────────────────────────────────┼─────────────────┤
       │                                  │                 │
       │  6. Cache token in localStorage  │                 │
       │     with expiration time         │                 │
       │                                  │                 │
       │  3b. Token valid                 │                 │
       │  ───> Use cached token           │                 │
       │                                  │                 │
       │  7. POST /api/chat-ai/v1/bots/   │                 │
       │     {botId}/messages             │                 │
       │     Headers: {                   │                 │
       │       Authorization: Bearer ...  │                 │
       │     }                            │                 │
       │     Body: {                      │                 │
       │       messages: [...],           │                 │
       │       controls: {...}            │                 │
       │     }                            │                 │
       ├──────────────────────────────────┼────────────────>│
       │                                  │                 │
       │  8. AI processes request         │                 │
       │     (LLM generates notes)        │                 │
       │                                  │                 │
       │  9. Return response:             │                 │
       │     {                            │                 │
       │       markdown: "...",           │                 │
       │       next_steps: [...],         │                 │
       │       coach_insights: {...},     │                 │
       │       suggested_questions: [...]│                 │
       │     }                            │                 │
       │<─────────────────────────────────┼─────────────────┤
       │                                  │                 │
       │  10. Parse and display output    │                 │
       │      in OutputPanel              │                 │
       │                                  │                 │
       ▼                                  ▼                 ▼
```

### Data Flow

1. **User Input** → Form data collected in `InputPanel.tsx`
   - Meeting title, agenda, transcript
   - Context tags (client-facing, internal, sensitive)

2. **Control Selection** → User configures output preferences
   - Audience, tone, view mode, department focus
   - Meeting preset selection (optional)

3. **API Request** → `apiService.ts` handles communication
   - Token acquisition (OAuth 2.0 client credentials)
   - POST request with messages + controls
   - Error handling and retry logic

4. **AI Processing** → Backend agent analyzes input
   - LLM processes transcript with control parameters
   - Extracts action items with owners and due dates
   - Generates meeting coach insights (if enabled)
   - Produces markdown-formatted summary

5. **Response Parsing** → `OutputPanel.tsx` renders results
   - Markdown converted to HTML with syntax highlighting
   - Action items table generated
   - Coach insights displayed in accordion
   - Suggested questions for follow-up

6. **User Actions** → Export, interrogate, or regenerate
   - CSV export of action items
   - Email draft generation
   - PDF/print via browser
   - Transcript interrogation modal for Q&A

---

## MSAL Authentication Setup

This application uses **Microsoft Authentication Library (MSAL)** to authenticate users via **Microsoft Entra ID (Azure AD)**. Follow these steps to configure authentication for your organization.

### Step 1: Azure AD App Registration

1. Navigate to the [Azure Portal](https://portal.azure.com)
2. Go to **Azure Active Directory** → **App registrations**
3. Click **"New registration"**

4. **Configure the app**:
   - **Name**: `Meeting Notes Generator` (or your preferred name)
   - **Supported account types**: Select **"Accounts in this organizational directory only (Single tenant)"**
   - **Redirect URI**:
     - Platform: **Single-page application (SPA)**
     - URI: `http://localhost:5173` (for local development)
     - Add production URI: `https://yourdomain.com` (when deploying)

5. Click **"Register"**

6. **Note the following values** (you'll need these):
   - **Application (client) ID**: e.g., `5fa64631-ea56-4676-b6d5-433d322a4da1`
   - **Directory (tenant) ID**: e.g., `d026e4c1-5892-497a-b9da-ee493c9f0364`

### Step 2: Configure API Permissions

1. In your app registration, go to **API permissions**
2. Click **"Add a permission"**
3. Select **"Microsoft Graph"**
4. Choose **"Delegated permissions"**
5. Add the following permissions:
   - ✅ `User.Read` - Read user profile information (display name, email, job title)
   - ✅ `profile` - View user's basic profile
   - ✅ `openid` - Sign in and read user profile

6. Click **"Add permissions"**
7. (Optional) Click **"Grant admin consent"** if you have admin privileges (recommended)

### Step 3: Configure Authentication Settings

1. Go to **Authentication** in your app registration
2. Under **Single-page application**:
   - Ensure your redirect URIs are listed:
     - `http://localhost:5173` (development)
     - `https://yourdomain.com` (production)
     - `https://aistudio.google.com` (if deploying to AI Studio)

3. Under **Implicit grant and hybrid flows**:
   - ❌ Do NOT check "Access tokens"
   - ❌ Do NOT check "ID tokens"
   - (MSAL uses Authorization Code Flow with PKCE, not implicit flow)

4. Under **Advanced settings**:
   - **Allow public client flows**: No
   - **Enable the following mobile and desktop flows**: No

5. Click **"Save"**

### Step 4: Update Application Configuration

Edit `auth/authConfig.ts`:

```typescript
export const msalConfig = {
  auth: {
    clientId: "YOUR_CLIENT_ID_HERE", // From Step 1
    authority: "https://login.microsoftonline.com/YOUR_TENANT_ID_HERE", // From Step 1
    redirectUri: "http://localhost:5173", // Change for production
  },
  cache: {
    cacheLocation: "sessionStorage", // Options: "sessionStorage" or "localStorage"
    storeAuthStateInCookie: false,
  },
};

export const loginRequest = {
  scopes: ["User.Read"], // Microsoft Graph API scope
};

export const graphConfig = {
  graphMeEndpoint: "https://graph.microsoft.com/v1.0/me",
  graphPhotoEndpoint: "https://graph.microsoft.com/v1.0/me/photo/$value",
};
```

### Step 5: Environment-Specific Configuration

**Development** (`http://localhost:5173`):
- Use `redirectUri: "http://localhost:5173"`
- Token cache: `sessionStorage` (cleared on tab close)

**Production** (custom domain):
- Use `redirectUri: "https://yourdomain.com"`
- Token cache: Consider `localStorage` for persistence across tabs
- Ensure HTTPS is configured

**AI Studio Deployment** (`https://aistudio.google.com`):
- Add redirect URI: `https://aistudio.google.com`
- The app will auto-detect AI Studio environment and use mock authentication

### Step 6: Test Authentication

1. Start the development server: `npm run dev`
2. Open `http://localhost:5173`
3. You should see the sign-in page
4. Click **"Sign in with Microsoft"**
5. A popup window will open (or redirect if popups are blocked)
6. Enter your Microsoft credentials
7. Consent to the requested permissions (if first time)
8. You should be redirected back to the app with your profile loaded

### Authentication Flow Details

**Token Acquisition**:
- **Initial Login**: Interactive popup or redirect
- **Silent Acquisition**: MSAL attempts to acquire tokens silently using cached refresh tokens
- **Token Expiration**: Automatic refresh 60 seconds before expiration

**Token Storage**:
- **Session Storage**: Tokens stored in `sessionStorage` by default (cleared on tab close)
- **Local Storage Backup**: API access token cached in `localStorage` with expiration tracking

**Logout Behavior**:
- Clears session storage
- Redirects to Azure AD logout endpoint
- Returns to app home page

### Troubleshooting MSAL Errors

#### Error: `AADSTS50011` - Redirect URI mismatch
**Solution**: Ensure the `redirectUri` in `authConfig.ts` exactly matches one of the URIs registered in Azure AD (including trailing slashes).

#### Error: `AADSTS65001` - User or administrator has not consented
**Solution**: Have an admin grant consent in Azure AD, or ensure users consent during first login.

#### Error: `AADSTS700016` - Application not found in directory
**Solution**: Verify the `clientId` and `tenantId` in `authConfig.ts` are correct.

#### Error: Popup blocked
**Solution**: The app will detect popup blocking and show a fallback UI with instructions to allow popups or use redirect flow.

#### Error: `interaction_in_progress`
**Solution**: This occurs when multiple login attempts happen simultaneously. The app handles this automatically by waiting for the first interaction to complete.

---

## Configuration

### Environment Variables

The application uses environment variables for sensitive configuration.

| Variable | Required | Description | Example |
|----------|----------|-------------|---------|
| `CLIENT_ID` | ✅ Yes | API client identifier for Interact.interpublic.com | `"MeetingNotes"` |
| `CLIENT_SECRET` | ✅ Yes | API client secret for authentication | `"eOk9dez@#En@nWw2w%0N"` |
| `DEFAULT_BOT_ID` | ✅ Yes | Bot ID for the AI agent | `"64650431-dad7-4b47-8bb1-4a81800f9f5f"` |
| `GEMINI_API_KEY` | ❌ No | Google Gemini API key (not currently used) | `"PLACEHOLDER_API_KEY"` |

### API Configuration

**Base URL**: `https://interact.interpublic.com`

**Endpoints**:
- **Token**: `POST /api/token`
- **Chat/Messages**: `POST /api/chat-ai/v1/bots/{botId}/messages`

**Authentication**: OAuth 2.0 Client Credentials Flow

**Request Headers**:
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

### Bot ID Configuration

The Bot ID identifies which AI agent to use for processing. You can configure this in two ways:

1. **Environment Variable** (default):
   - Set `DEFAULT_BOT_ID` in `.env.local`

2. **Settings Panel** (runtime):
   - Click the ⚙️ icon in the header
   - Enter a new Bot ID
   - Click "Save" (persisted to `localStorage`)

### MSAL Configuration

**File**: `auth/authConfig.ts`

```typescript
export const msalConfig = {
  auth: {
    clientId: "5fa64631-ea56-4676-b6d5-433d322a4da1",
    authority: "https://login.microsoftonline.com/d026e4c1-5892-497a-b9da-ee493c9f0364",
    redirectUri: "http://localhost:5173", // Change for production
  },
  cache: {
    cacheLocation: "sessionStorage",
    storeAuthStateInCookie: false,
  },
};
```

**Customization Options**:
- `cacheLocation`: `"sessionStorage"` (tab-scoped) or `"localStorage"` (browser-scoped)
- `storeAuthStateInCookie`: Set to `true` for IE11 support
- `navigateToLoginRequestUrl`: Set to `false` to stay on current page after login

### Vite Proxy Configuration

**File**: `vite.config.ts`

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'https://interact.interpublic.com',
        changeOrigin: true,
        secure: true,
      },
    },
  },
});
```

**Purpose**: Bypasses CORS restrictions during local development by proxying API requests through the Vite dev server.

**Production**: Remove or disable proxy configuration; ensure CORS headers are configured on the API server.

### Meeting Presets

**File**: `constants.ts`

Presets define pre-configured combinations of settings. To add a custom preset:

```typescript
export const MEETING_PRESETS = {
  'my-custom-preset': {
    audience: 'cross-functional',
    tone: 'professional',
    critical_lens: false,
    redact: false,
    use_icons: true,
    bold_important_words: true,
    meeting_coach: true,
    coaching_style: 'gentle',
    view: 'full',
    focus_department: ['General'],
    meeting_preset: 'my-custom-preset',
  },
  // ... other presets
};
```

---

## API Documentation

### Base URL

```
https://interact.interpublic.com
```

### Authentication

All API requests require an OAuth 2.0 access token obtained via the Client Credentials flow.

#### 1. Obtain Access Token

**Endpoint**: `POST /api/token`

**Request Body**:
```json
{
  "client_id": "MeetingNotes",
  "client_secret": "eOk9dez@#En@nWw2w%0N",
  "grant_type": "client_credentials"
}
```

**Response**:
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

**Token Caching**: Tokens are cached in `localStorage` with expiration tracking. Automatically refreshed 60 seconds before expiration.

### Key Endpoints

#### 2. Generate Meeting Notes

**Endpoint**: `POST /api/chat-ai/v1/bots/{botId}/messages`

**Headers**:
```json
{
  "Authorization": "Bearer <access_token>",
  "Content-Type": "application/json"
}
```

**Request Body**:
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI assistant that generates meeting notes..."
    },
    {
      "role": "user",
      "content": "Meeting Title: Q4 Planning\n\nAgenda Items:\n- Budget review\n- Staffing\n\nTranscript:\nJohn: Let's discuss the Q4 budget...\nSarah: I suggest we increase marketing spend..."
    }
  ],
  "controls": {
    "focus_department": ["STR", "PM"],
    "view": "full",
    "critical_lens": true,
    "audience": "cross-functional",
    "tone": "professional",
    "redact": false,
    "use_icons": true,
    "bold_important_words": true,
    "meeting_coach": true,
    "coaching_style": "direct",
    "meeting_preset": "internal-sync"
  }
}
```

**Response**:
```json
{
  "markdown": "# Q4 Planning Meeting Summary\n\n## Key Decisions\n...",
  "next_steps": [
    {
      "department": "STR",
      "owner": "Sarah Johnson",
      "task": "Develop revised marketing budget proposal",
      "due_date": "2024-02-15",
      "status": "AMBER",
      "status_notes": "Awaiting input from finance team"
    }
  ],
  "coach_insights": {
    "initiative": "Q4 Planning",
    "style": "direct",
    "strengths": [
      "Clear agenda structure",
      "Diverse participation"
    ],
    "improvements": [
      "Assign owners to all action items",
      "Document specific deadlines"
    ],
    "facilitation_tips": [
      "Use a parking lot for off-topic items",
      "Recap decisions before closing"
    ],
    "metrics": {
      "agenda_coverage": 85,
      "decision_count": 3,
      "action_count": 7,
      "participant_diversity": 6
    },
    "flags": {
      "participation_imbalance": false,
      "many_unassigned": true,
      "few_decisions": false
    }
  },
  "suggested_questions": [
    "What are the specific risks identified for Q4?",
    "Who will be responsible for tracking budget changes?"
  ]
}
```

### Error Responses

**401 Unauthorized**:
```json
{
  "error": "invalid_token",
  "error_description": "The access token is invalid or expired"
}
```

**400 Bad Request**:
```json
{
  "error": "invalid_request",
  "error_description": "Missing required field: messages"
}
```

**500 Internal Server Error**:
```json
{
  "error": "internal_error",
  "error_description": "An unexpected error occurred"
}
```

---

## Deployment

### Google Cloud Run Deployment Progress

This section tracks the progress of deploying Momentum Note Crafter to Google Cloud Run.

#### Project Information

- **GCP Project**: `mom-ai-apps`
- **Project Team**: Luis Bustos, Nick Keller (Editors), Jeff Davalos (Admin)
- **Target Platform**: Google Cloud Run
- **Repository**: Git initialized locally

#### Deployment Progress Tracker

| Step | Status | Details | Notes |
|------|--------|---------|-------|
| 1. Initialize Git Repository | ✅ Complete | Commit: `7a9bfce` | Initial commit with all source code |
| 2. Rename Environment Variables | ✅ Complete | Commit: `d1557af` | Removed VITE_ prefix, updated vite.config.ts |
| 3. Install Docker Desktop | ⏳ Pending | Required | Need Docker to build images locally |
| 4. Obtain nginx.conf | ⏳ Waiting | **Critical** | Nick sending - needed for Dockerfile COPY command |
| 5. Confirm GCP Registry URL | ⏳ Waiting | TBD | Region: us-east4? Repo: note-crafter? |
| 6. Add npm build script | ⏳ Pending | package.json | Need to add `"build": "vite build"` |
| 7. Create Dockerfile | ⏳ Pending | Blocked | Waiting on nginx.conf and registry URL |
| 8. Adapt build-push-image script | ⏳ Pending | Blocked | Waiting on registry URL confirmation |
| 9. Create Cloud Artifact Registry | ⏳ Pending | TBD | Jeff may need to create this |
| 10. Build Docker Image Locally | ⏳ Pending | Blocked | Requires Docker + Dockerfile |
| 11. Push Image to Registry | ⏳ Pending | Blocked | Requires build-push-image script |
| 12. Create Cloud Run Service | ⏳ Pending | Blocked | Requires pushed Docker image |
| 13. Configure Environment Variables | ⏳ Pending | Cloud Run | Set CLIENT_ID, CLIENT_SECRET, DEFAULT_BOT_ID |
| 14. Update MSAL Redirect URI | ⏳ Pending | authConfig.ts | Set to Cloud Run URL |
| 15. Test Production Deployment | ⏳ Pending | Final | Verify authentication and API calls work |

#### Outstanding Questions for Nick

1. **nginx.conf file** (Critical): Can you send the nginx.conf file? The Dockerfile references it via `COPY nginx.conf /etc/nginx/conf.d/default.conf`
   - Does it include API proxying configuration for `/api/*` → `https://interact.interpublic.com`?

2. **GCP Registry Configuration**:
   - Region: Should we use `us-east4` (same as your staffing app)?
   - Repository name: Should it be `note-crafter`?
   - Full URL format: `us-east4-docker.pkg.dev/mom-ai-apps/note-crafter`?

3. **Environment Variables Strategy**:
   - Should we pass them as build-time `ENV` in Dockerfile?
   - Or configure them in Cloud Run environment settings?
   - Required vars: `CLIENT_ID`, `CLIENT_SECRET`, `DEFAULT_BOT_ID`, `MSAL_CLIENT_ID`, `MSAL_TENANT_ID`

4. **Cloud Run URL**: What will the production URL be? (Needed for MSAL redirect URI configuration)

5. **Architecture Confirmation**: Your staffing app - does it use:
   - Option A: Frontend with Nginx proxy (1 Cloud Run service)?
   - Option B: Separate frontend + backend (2 Cloud Run services)?

#### Outstanding Questions for Jeff

1. **Cloud Artifact Registry**: Does the registry repository need to be created, or does it auto-create on first push?

2. **Networking**: You mentioned subnet requirements - what are the specific networking needs?

#### Git Commit History

```bash
d1557af - Rename environment variables for Docker deployment compatibility
7a9bfce - Initial commit: Note Crafter app
```

#### Next Immediate Actions

1. **Install Docker Desktop** (Luis) - Download from [docker.com](https://www.docker.com/products/docker-desktop)
2. **Add build script** to package.json:
   ```json
   "scripts": {
     "dev": "vite",
     "build": "vite build",
     "preview": "vite preview"
   }
   ```
3. **Wait for nginx.conf** from Nick
4. **Confirm registry details** with Nick

---

### Build for Production

1. **Set production environment variables**:

Create a `.env.production` file:

```env
CLIENT_ID="MeetingNotes"
CLIENT_SECRET="your-production-secret"
DEFAULT_BOT_ID="64650431-dad7-4b47-8bb1-4a81800f9f5f"
```

2. **Update MSAL redirect URI** in `auth/authConfig.ts`:

```typescript
redirectUri: "https://yourdomain.com"
```

3. **Build the application**:

```bash
npm run build
```

Expected output:
```
vite v5.2.11 building for production...
✓ 1234 modules transformed.
dist/index.html                    1.23 kB
dist/assets/index-a1b2c3d4.css    45.67 kB │ gzip: 12.34 kB
dist/assets/index-e5f6g7h8.js    234.56 kB │ gzip: 78.90 kB
✓ built in 5.67s
```

4. **Preview the build locally** (optional):

```bash
npm run preview
```

### Deployment Platforms

#### Option 1: Vercel

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Configure environment variables in Vercel dashboard:
   - Add `CLIENT_ID`
   - Add `CLIENT_SECRET`
   - Add `DEFAULT_BOT_ID`

4. Update Azure AD redirect URI to match Vercel deployment URL

#### Option 2: Azure Static Web Apps

1. Create a Static Web App in Azure Portal

2. Connect to your GitHub repository

3. Configure build settings:
   - **App location**: `/`
   - **API location**: (leave empty)
   - **Output location**: `dist`

4. Add environment variables in Azure Portal:
   - Navigate to **Configuration** → **Application settings**
   - Add `CLIENT_ID`, `CLIENT_SECRET`, `DEFAULT_BOT_ID`

5. Push to GitHub to trigger automatic deployment

#### Option 3: Google AI Studio

1. Ensure your app is ready for AI Studio:
   - Set redirect URI to `https://aistudio.google.com`
   - Mock authentication will activate automatically

2. Deploy via AI Studio interface:
   - Upload your built `dist/` folder
   - Configure app settings
   - Publish to AI Studio app gallery

3. Access your app at: `https://ai.studio/apps/drive/{your-app-id}`

### SSL/TLS Configuration

**Vercel/Azure**: SSL certificates are automatically provisioned.

**Custom Domain**:
1. Configure DNS records (A or CNAME)
2. Enable HTTPS via your hosting provider
3. Enforce HTTPS redirects

### CORS Configuration

For production, ensure your API server (`interact.interpublic.com`) allows requests from your deployment domain:

**Required headers**:
```
Access-Control-Allow-Origin: https://yourdomain.com
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Authorization, Content-Type
```

**Vite proxy** is only for local development and should be disabled/removed in production builds.

### Environment-Specific Configuration

**Development**:
- `redirectUri`: `http://localhost:5173`
- `cacheLocation`: `sessionStorage`
- Vite proxy enabled

**Production**:
- `redirectUri`: `https://yourdomain.com`
- `cacheLocation`: `localStorage` (optional, for cross-tab persistence)
- Vite proxy disabled
- Minified build
- HTTPS enforced

---

## Troubleshooting

### Authentication Issues

#### Problem: "Popup blocked" error
**Solution**:
1. The app will detect popup blocking and show fallback UI
2. Allow popups for `login.microsoftonline.com` in browser settings
3. Alternatively, the app will fall back to redirect flow

#### Problem: "AADSTS50011 - Redirect URI mismatch"
**Solution**:
- Verify `redirectUri` in `auth/authConfig.ts` matches Azure AD app registration
- Include or exclude trailing slash consistently
- Ensure protocol matches (http vs https)

#### Problem: User profile not loading
**Solution**:
1. Check browser console for Microsoft Graph API errors
2. Verify `User.Read` permission is granted in Azure AD
3. Check network tab for 401/403 responses
4. Ensure access token is present in Authorization header

#### Problem: Silent token acquisition fails
**Solution**:
- Clear browser cache and cookies
- Log out and log back in
- Check if token is expired (should auto-refresh)
- Verify MSAL cache location setting

### API Connection Issues

#### Problem: "Failed to fetch token" error
**Solution**:
1. Verify `CLIENT_ID` and `CLIENT_SECRET` in `.env.local`
2. Check network tab for 401/400 responses
3. Ensure API credentials are correct
4. Confirm API server is accessible (not behind firewall)

#### Problem: "Bot ID not found" error
**Solution**:
1. Open Settings panel (⚙️ icon)
2. Verify Bot ID matches a valid agent
3. Try default Bot ID: `64650431-dad7-4b47-8bb1-4a81800f9f5f`
4. Contact IT/DevOps for valid Bot IDs

#### Problem: CORS errors in browser console
**Solution**:
- **Development**: Ensure Vite proxy is configured correctly in `vite.config.ts`
- **Production**: Contact API administrator to add your domain to CORS whitelist
- Verify API base URL is correct

#### Problem: Token expires too quickly
**Solution**:
- Tokens are cached and auto-refreshed 60 seconds before expiration
- Check `expires_in` value from `/api/token` response
- Ensure token refresh logic is working (check browser console logs)

### Build/Deployment Errors

#### Problem: `npm run build` fails with TypeScript errors
**Solution**:
1. Run `npm install` to ensure dependencies are up-to-date
2. Check TypeScript errors in console output
3. Fix type issues in code
4. Verify `tsconfig.json` settings

#### Problem: Environment variables not working in production
**Solution**:
- Ensure environment variables are configured properly in your build system
- Re-run build after changing `.env` files
- Verify environment variables are set in hosting platform dashboard
- Check `import.meta.env.*` usage in code

#### Problem: "Cannot find module" errors after deployment
**Solution**:
1. Verify all imports use correct relative paths
2. Check case sensitivity (Unix/Linux is case-sensitive)
3. Ensure `node_modules` are installed (`npm install`)
4. Rebuild with `npm run build`

### UI/UX Issues

#### Problem: Dark mode not persisting
**Solution**:
- Check browser localStorage for `theme` key
- Verify localStorage is not disabled (private browsing mode)
- Try clearing browser cache

#### Problem: Form data not saving
**Solution**:
- Check localStorage quota (usually 5-10 MB)
- Verify localStorage is enabled
- Try "Clear Data" button and re-enter

#### Problem: File upload not working
**Solution**:
1. Ensure file is `.txt` or `.docx` format
2. Check file size (recommended < 5 MB)
3. For `.docx`, verify Mammoth.js library loaded (check network tab)
4. Check browser console for parsing errors

#### Problem: Export to CSV/Email not working
**Solution**:
- Ensure action items table is populated
- Check browser console for export errors
- Verify browser allows downloads (not blocked)
- For email draft, check if default email client is configured

### Performance Issues

#### Problem: Slow note generation
**Solution**:
- API processing time depends on transcript length
- Typical processing: 5-15 seconds for 5-page transcripts
- Check network tab for slow API responses
- Try shorter transcripts to isolate issue

#### Problem: App feels sluggish
**Solution**:
1. Clear browser cache
2. Disable browser extensions (ad blockers, etc.)
3. Check for large localStorage data (clear if needed)
4. Use latest Chrome/Edge browser for best performance

---

## File Structure

```
c:\Users\luis.bustos\Downloads\Momo Mettings App\
│
├── 📁 auth/                          # Authentication module
│   ├── authConfig.ts                 # MSAL configuration (client ID, tenant ID, scopes)
│   ├── AuthGuard.tsx                 # Authentication wrapper component
│   └── SignInPage.tsx                # Sign-in UI (popup blocked fallback)
│
├── 📁 components/                    # React components
│   ├── Header.tsx                    # App header with user menu, theme toggle, settings
│   ├── InputPanel.tsx                # Left panel: meeting input form
│   ├── OutputPanel.tsx               # Right panel: generated notes display
│   ├── SettingsDrawer.tsx            # Slide-out settings panel (Bot ID config)
│   ├── HelpModal.tsx                 # Help documentation modal
│   ├── EmailDraftModal.tsx           # Email export modal
│   ├── InterrogateTranscriptModal.tsx # Transcript Q&A chat interface
│   │
│   ├── 📁 tour/                      # Onboarding tour components
│   │   ├── TourWelcomeModal.tsx      # Welcome modal (first launch)
│   │   ├── TourStep.tsx              # Individual tour step with highlight
│   │   └── TourController.tsx        # Tour orchestration and state management
│   │
│   └── 📁 ui/                        # Reusable UI component library
│       ├── Button.tsx                # Button with variants (primary, secondary, ghost)
│       ├── Icon.tsx                  # SVG icon system (30+ icons)
│       ├── Card.tsx                  # Card container with shadow/border
│       ├── Input.tsx                 # Text input with label
│       ├── Textarea.tsx              # Text area with auto-resize
│       ├── Toast.tsx                 # Toast notification system
│       ├── ToggleSwitch.tsx          # Toggle switch control
│       ├── Select.tsx                # Select dropdown with search
│       ├── Chip.tsx                  # Tag/chip component (removable)
│       ├── Tooltip.tsx               # Tooltip with hover trigger
│       ├── LoadingModal.tsx          # Full-screen loading spinner
│       └── SkeletonLoader.tsx        # Content loading skeleton
│
├── 📁 contexts/                      # React Context providers
│   ├── AuthContext.tsx               # Authentication state (user, logout, profile)
│   └── TourContext.tsx               # Tour state (current step, completion)
│
├── 📁 hooks/                         # Custom React hooks
│   ├── useLocalStorage.ts            # localStorage with React state sync
│   └── useDebounce.ts                # Debounce hook for input delays
│
├── 📁 services/                      # API service layer
│   ├── apiService.ts                 # API client (token acquisition, chat endpoint)
│   └── geminiService.ts              # Placeholder for Google Gemini (unused)
│
├── 📁 utils/                         # Utility functions
│   ├── export.ts                     # CSV export logic
│   ├── formatting.ts                 # Markdown to HTML conversion
│   ├── parsing.ts                    # Text parsing utilities
│   └── tourHelper.ts                 # Tour helper functions
│
├── 📄 App.tsx                        # Main app component (layout, routing)
├── 📄 index.tsx                      # React DOM entry point
├── 📄 index.html                     # HTML template (Tailwind CDN, meta tags)
├── 📄 types.ts                       # TypeScript interfaces and types
├── 📄 constants.ts                   # App constants (departments, presets, defaults)
│
├── 📄 vite.config.ts                 # Vite configuration (proxy, build settings)
├── 📄 tsconfig.json                  # TypeScript configuration (strict mode, paths)
├── 📄 package.json                   # Dependencies and scripts
├── 📄 package-lock.json              # Dependency lock file
│
├── 📄 .env.local                     # Environment variables (not in git)
├── 📄 .env.example                   # Example environment variables template
├── 📄 .gitignore                     # Git ignore rules
│
└── 📄 README.md                      # Project documentation (this file)
```

### Key Files Explained

#### Configuration Files

- **`vite.config.ts`**: Vite build tool configuration
  - Dev server settings (port 5173)
  - API proxy to `https://interact.interpublic.com` (bypasses CORS in dev)
  - React plugin with Fast Refresh

- **`tsconfig.json`**: TypeScript compiler configuration
  - Target: ES2022
  - Strict mode enabled (type safety)
  - Path aliases: `@/*` maps to project root

- **`.env.local`**: Environment variables (gitignored)
  - API credentials (client ID, secret)
  - Bot ID for AI agent
  - Sensitive data (never commit)

#### Core Application Files

- **`App.tsx`**: Main application component
  - Wraps entire app with MSAL provider
  - Provides AuthContext and TourContext
  - Splits UI into InputPanel and OutputPanel
  - Handles dark mode theme

- **`types.ts`**: TypeScript type definitions
  - FormState, Controls, AgentResponse, NextStep, CoachInsights
  - Type safety across entire codebase

- **`constants.ts`**: Application constants
  - Department list
  - Meeting presets configurations
  - Default control values
  - Context tag options

#### Authentication Module

- **`auth/authConfig.ts`**: MSAL configuration
  - Client ID, tenant ID, authority URL
  - Scopes (User.Read)
  - Microsoft Graph endpoints

- **`auth/AuthGuard.tsx`**: Authentication wrapper
  - Detects AI Studio environment (uses mock auth)
  - Handles MSAL initialization
  - Manages login flow (popup vs redirect)
  - Fetches user profile from Microsoft Graph

- **`auth/SignInPage.tsx`**: Sign-in UI
  - Shown when user is not authenticated
  - Popup blocked detection and fallback

#### Service Layer

- **`services/apiService.ts`**: API client
  - Token acquisition with caching
  - Chat/message endpoint for note generation
  - Error handling and retry logic
  - Token refresh before expiration

#### Component Architecture

**Input Components** (`InputPanel.tsx`):
- Meeting title, agenda, transcript inputs
- File upload (`.txt`, `.docx`)
- Control selectors (audience, tone, view mode)
- Meeting presets dropdown
- Advanced controls accordion
- Sample data loader

**Output Components** (`OutputPanel.tsx`):
- Markdown-formatted meeting summary
- Action items table with status indicators
- Meeting coach insights accordion
- Suggested questions
- Export buttons (CSV, Email, PDF)
- Transcript interrogation button

**UI Component Library** (`components/ui/`):
- 13 reusable components
- Consistent Tailwind CSS styling
- Accessible (ARIA labels, semantic HTML)
- Dark mode support

---

## Development Notes

### For Developers

#### Prerequisites for Contributing

- Familiarity with React 18 (hooks, context)
- TypeScript experience (strict mode)
- Understanding of OAuth 2.0 / MSAL
- Tailwind CSS knowledge

#### Coding Standards

**TypeScript**:
- Use strict mode (enabled in `tsconfig.json`)
- Define explicit types for all function parameters and return values
- Use interfaces for object shapes
- Avoid `any` type (use `unknown` if necessary)

**React**:
- Use functional components with hooks
- Prefer composition over inheritance
- Keep components small and focused
- Use Context API for global state (avoid prop drilling)
- Memoize expensive computations with `useMemo`/`useCallback`

**Naming Conventions**:
- Components: PascalCase (`MyComponent.tsx`)
- Functions/variables: camelCase (`handleSubmit`, `userData`)
- Constants: UPPER_SNAKE_CASE (`DEFAULT_BOT_ID`)
- Types/Interfaces: PascalCase (`FormState`, `AgentResponse`)

**File Organization**:
- One component per file
- Co-locate related files (e.g., `Tour` components in `components/tour/`)
- Keep utility functions in `utils/`
- Keep API calls in `services/`

#### Testing Approach

**Manual Testing**:
1. Test authentication flow (login, logout)
2. Test meeting note generation with various inputs
3. Test export functionality (CSV, email, PDF)
4. Test dark mode toggle
5. Test file upload (`.txt`, `.docx`)
6. Test responsive design (desktop, tablet)

**Recommended Test Cases**:
- Empty transcript handling
- Very long transcripts (>10,000 words)
- Special characters in input
- Invalid file formats
- API timeout scenarios
- Token expiration and refresh
- Popup blocker scenarios

**Automated Testing** (future):
- Consider adding Jest + React Testing Library
- Unit tests for utility functions
- Integration tests for API service
- E2E tests with Playwright/Cypress

#### Adding New Features

**Example: Adding a new meeting preset**

1. Define preset in `constants.ts`:
```typescript
export const MEETING_PRESETS = {
  'my-new-preset': {
    audience: 'executive',
    tone: 'concise',
    critical_lens: false,
    redact: true,
    use_icons: false,
    bold_important_words: true,
    meeting_coach: false,
    coaching_style: 'gentle',
    view: 'actions-only',
    focus_department: ['General'],
    meeting_preset: 'my-new-preset',
  },
  // ...
};
```

2. Add to UI in `InputPanel.tsx`:
```typescript
<option value="my-new-preset">🎯 My New Preset</option>
```

3. Test with sample meeting data

**Example: Adding a new export format**

1. Create utility function in `utils/export.ts`:
```typescript
export function exportToJSON(data: AgentResponse, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: 'application/json',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
```

2. Add button in `OutputPanel.tsx`:
```typescript
<Button
  variant="ghost"
  onClick={() => exportToJSON(output, 'meeting-notes.json')}
>
  <Icon name="download" className="mr-2" />
  Export JSON
</Button>
```

#### Debugging Tips

**React DevTools**:
- Install React DevTools browser extension
- Inspect component props and state
- Profile rendering performance

**Network Debugging**:
- Use browser DevTools Network tab
- Check API request/response payloads
- Verify Authorization headers

**MSAL Debugging**:
- Enable MSAL logging in `authConfig.ts`:
```typescript
system: {
  loggerOptions: {
    loggerCallback: (level, message, containsPii) => {
      console.log(message);
    },
    piiLoggingEnabled: false,
    logLevel: LogLevel.Verbose,
  },
}
```

#### Contributing Guidelines

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/my-new-feature`
3. **Make your changes**
4. **Test thoroughly** (manual testing + edge cases)
5. **Commit with clear messages**: `git commit -m "Add JSON export functionality"`
6. **Push to your fork**: `git push origin feature/my-new-feature`
7. **Open a pull request** with detailed description

**Pull Request Checklist**:
- [ ] Code follows project conventions
- [ ] TypeScript types are defined
- [ ] No console errors or warnings
- [ ] Tested in Chrome and Edge
- [ ] Dark mode works correctly
- [ ] README updated (if needed)

---

## Recent Changes

### 📅 Latest Update - 2025-01-21

**Summary**: Prepared Meeting Notes Generator for Google Cloud Run deployment by renaming environment variables and adding deployment progress tracker.

#### Changes

**Environment Variables**:
- ✅ Removed `VITE_` prefix from `CLIENT_ID`, `CLIENT_SECRET`, `DEFAULT_BOT_ID`
- ✅ Updated `vite.config.ts` to expose non-VITE_ prefixed variables using `loadEnv`
- ✅ Updated all code references in `App.tsx` and `SettingsDrawer.tsx`
- ✅ Updated TypeScript type definitions in `vite-env.d.ts`
- ✅ Updated `.env.example` template

**Deployment Preparation**:
- ✅ Initialized Git repository (commit: `7a9bfce`)
- ✅ Committed environment variable changes (commit: `d1557af`)
- ✅ Added comprehensive deployment progress tracker to README
- ✅ Documented outstanding questions for Nick and Jeff
- ✅ Created deployment roadmap with 15 tracked steps

**Documentation**:
- ✅ Added "Google Cloud Run Deployment Progress" section to README
- ✅ Added deployment progress tracker table
- ✅ Documented GCP project information (`mom-ai-apps`)
- ✅ Listed next immediate actions and blockers

#### Git Commits

- `d1557af` - Rename environment variables for Docker deployment compatibility
- `7a9bfce` - Initial commit: Note Crafter app

#### Benefits

- ✅ Environment variables now compatible with Docker build-time injection
- ✅ Clear deployment roadmap with trackable progress
- ✅ All stakeholders have visibility into deployment status
- ✅ Blockers and dependencies clearly documented
- ✅ Git history provides version control for Docker image tagging

---

### 📅 Previous Update - 2024-01-20

**Summary**: Initial comprehensive documentation created for Meeting Notes Generator application, including full README and environment configuration template.

#### Changes

**Documentation**:
- ✅ Created comprehensive README.md with 15 major sections
- ✅ Added detailed MSAL authentication setup guide
- ✅ Documented API integration with code examples
- ✅ Included troubleshooting guide for common issues
- ✅ Provided deployment instructions for multiple platforms

**Configuration**:
- ✅ Created `.env.example` template for easy setup
- ✅ Documented all environment variables
- ✅ Added security notes for sensitive data

**Architecture Documentation**:
- ✅ System architecture diagram (ASCII)
- ✅ Authentication flow diagram
- ✅ API request flow diagram
- ✅ Complete file structure breakdown

#### Files Modified

- [README.md](README.md) - Created comprehensive project documentation
- [.env.example](.env.example) - Created environment variable template

#### Benefits

- ✅ New developers can onboard quickly with step-by-step setup instructions
- ✅ Authentication setup is clearly documented with Azure AD configuration steps
- ✅ Troubleshooting guide reduces support burden
- ✅ API documentation provides clear integration examples
- ✅ Deployment options documented for multiple platforms
- ✅ File structure explanation helps navigate codebase
- ✅ Security best practices highlighted throughout

---

## Version Information

**Version**: 1.0.0
**Last Updated**: January 20, 2024
**Status**: Production Ready ✅
**License**: Proprietary
**Maintained By**: Interpublic Group

---

## Support & Contact

**AI Studio Deployment**: [View App](https://ai.studio/apps/drive/15Ng3Teh9qlaWnXBSC6lFqqwkutt_0VXD)
**Issues**: Contact your IT/DevOps team
**Internal Documentation**: [Internal Wiki/Confluence]

---

**Built with ❤️ using React + TypeScript + MSAL + AI**
