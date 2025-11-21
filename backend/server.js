require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const { validateAzureADToken } = require('./middleware/auth');

// Import routes
const preHireRoutes = require('./routes/preHireRoutes');
const packageRoutes = require('./routes/packageRoutes');
const hardwareRoutes = require('./routes/hardwareRoutes');
const softwareRoutes = require('./routes/softwareRoutes');
const approvalRoutes = require('./routes/approvalRoutes');

const app = express();
const PORT = process.env.PORT || 8080;

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'https://interact.interpublic.com';
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

// Validate required environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: CLIENT_ID and CLIENT_SECRET must be set in environment variables');
  process.exit(1);
}

// Middleware
app.use(cors()); // Allow all origins for now (can restrict to frontend URL later)
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Health check endpoint (for Cloud Run)
app.get('/health', (req, res) => {
  res.status(200).send('healthy');
});

// Token endpoint - proxies to interact.interpublic.com/api/token
// Protected: Requires valid Azure AD token with Momentum group membership
app.post('/api/token', validateAzureADToken, async (req, res) => {
  try {
    console.log('Token request received');

    const response = await fetch(`${API_BASE_URL}/api/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Token request failed:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('Token acquired successfully');
    res.json(data);
  } catch (error) {
    console.error('Error fetching token:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to fetch token from API server'
    });
  }
});

// Chat/Messages endpoint - proxies to interact.interpublic.com/api/chat-ai/v1/bots/{botId}/messages
// Protected: Requires valid Azure AD token with Momentum group membership
app.post('/api/chat-ai/v1/bots/:botId/messages', validateAzureADToken, async (req, res) => {
  try {
    const { botId } = req.params;
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        error: 'unauthorized',
        error_description: 'Authorization header is required'
      });
    }

    console.log(`Chat request received for bot: ${botId}`);

    const response = await fetch(`${API_BASE_URL}/api/chat-ai/v1/bots/${botId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify(req.body),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Chat request failed:', response.status, data);
      return res.status(response.status).json(data);
    }

    console.log('Chat request successful');
    res.json(data);
  } catch (error) {
    console.error('Error in chat request:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to communicate with API server'
    });
  }
});

// Employee Onboarding System API Routes
app.use('/api/pre-hires', preHireRoutes);
app.use('/api/packages', packageRoutes);
app.use('/api/hardware', hardwareRoutes);
app.use('/api/software', softwareRoutes);
app.use('/api/approvals', approvalRoutes);

// Catch-all for undefined routes
app.use((req, res) => {
  res.status(404).json({
    error: 'not_found',
    error_description: 'The requested endpoint does not exist'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`Note Crafter Backend API listening on port ${PORT}`);
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Client ID configured: ${CLIENT_ID ? 'Yes' : 'No'}`);
  console.log(`Client Secret configured: ${CLIENT_SECRET ? 'Yes' : 'No'}`);
  console.log(`Azure AD Group Security: Enabled`);
  console.log(`Required Group: MOM WW All Users 1 SG (2c08b5d8-7def-4845-a48c-740b987dcffb)`);
});
