# Note Crafter Backend API

Backend proxy service for Momentum Note Crafter. This service securely handles API communications with `interact.interpublic.com`, keeping sensitive credentials server-side.

## Architecture

```
Frontend (React) → Backend (Node.js/Express) → interact.interpublic.com
```

The backend acts as a secure proxy:
- Stores `CLIENT_ID` and `CLIENT_SECRET` safely server-side
- Handles OAuth 2.0 token acquisition
- Proxies chat/AI requests with authentication
- Prevents credential exposure in browser

## Prerequisites

- Node.js 18.x or higher
- npm

## Quick Start

### 1. Install Dependencies

```bash
cd backend
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your credentials:

```env
PORT=8080
API_BASE_URL=https://interact.interpublic.com
CLIENT_ID=YourClientID
CLIENT_SECRET=YourClientSecret
```

### 3. Run Locally

```bash
npm start
```

Server will start on `http://localhost:8080`

## API Endpoints

### Health Check
```
GET /health
```

Returns `200 OK` with "healthy" response. Used by Cloud Run for health monitoring.

### Token Acquisition
```
POST /api/token
Content-Type: application/json
```

Proxies to `interact.interpublic.com/api/token` with client credentials.

**Response:**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "Bearer",
  "expires_in": 3600
}
```

### Chat/Messages
```
POST /api/chat-ai/v1/bots/:botId/messages
Authorization: Bearer <access_token>
Content-Type: application/json
```

Proxies to `interact.interpublic.com/api/chat-ai/v1/bots/{botId}/messages`.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI assistant..."
    },
    {
      "role": "user",
      "content": "Meeting content..."
    }
  ],
  "controls": {
    "audience": "executive",
    "tone": "professional"
  }
}
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `PORT` | No | Server port (default: 8080) |
| `API_BASE_URL` | No | interact.interpublic.com URL (default set) |
| `CLIENT_ID` | Yes | API client identifier |
| `CLIENT_SECRET` | Yes | API client secret (keep secure!) |

## Cloud Run Deployment

### Environment Variables Setup

**Option 1: Quick (Environment Variables)**
```bash
gcloud run deploy note-crafter-backend \
  --set-env-vars CLIENT_ID=YourClientID,CLIENT_SECRET=YourClientSecret
```

**Option 2: Secure (Secret Manager)** - Recommended for `CLIENT_SECRET`
1. Create secret in Secret Manager
2. Create service account for Cloud Run
3. Grant service account access to secret
4. Reference secret in Cloud Run

Nick can help set up Secret Manager.

### Dockerfile

The backend includes a Dockerfile for containerization:
- Based on `node:18-alpine`
- Runs as non-root user
- Exposes port 8080
- Optimized for Cloud Run

## Security Notes

- ✅ `CLIENT_SECRET` never exposed to frontend
- ✅ CORS enabled (restrict origins in production)
- ✅ Request logging for debugging
- ✅ Error handling prevents information leakage
- ⚠️ Use Secret Manager for `CLIENT_SECRET` in production

## Development

### Project Structure

```
backend/
├── server.js          # Main Express application
├── package.json       # Dependencies and scripts
├── .env.example       # Environment variable template
├── .gitignore         # Git ignore rules
├── Dockerfile         # Docker container definition
└── README.md          # This file
```

### Adding New Endpoints

To proxy additional endpoints from `interact.interpublic.com`:

```javascript
app.post('/api/your-new-endpoint', async (req, res) => {
  try {
    const response = await fetch(`${API_BASE_URL}/api/your-new-endpoint`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': req.headers.authorization,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'internal_error' });
  }
});
```

## Troubleshooting

### Server won't start
- Check `CLIENT_ID` and `CLIENT_SECRET` are set
- Verify port 8080 is not in use
- Check Node.js version (>= 18.0.0)

### API requests failing
- Check `API_BASE_URL` is correct
- Verify credentials are valid
- Check network connectivity to `interact.interpublic.com`
- May need VPC connector for Cloud Run (ask Jeff)

### CORS errors
- Ensure CORS middleware is enabled
- Restrict origins in production (update `cors()` config)

## License

Proprietary - Interpublic Group
