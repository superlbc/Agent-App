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
const COPILOT_DIRECT_LINE_SECRET = process.env.COPILOT_DIRECT_LINE_SECRET;
const COPILOT_API_URL = 'https://directline.botframework.com/v3/directline';
const PERSONNEL_LOOKUP_FLOW_URL = process.env.PERSONNEL_LOOKUP_FLOW_URL;

// Validate required environment variables
if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: CLIENT_ID and CLIENT_SECRET must be set in environment variables');
  process.exit(1);
}

// Copilot Studio endpoints require COPILOT_DIRECT_LINE_SECRET
if (!COPILOT_DIRECT_LINE_SECRET) {
  console.warn('WARNING: COPILOT_DIRECT_LINE_SECRET not set. Copilot endpoints will not work.');
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

// ==============================================================================
// Momentum Knowledge Base Chatbot - Copilot Studio Integration
// ==============================================================================

/**
 * Create a new Direct Line conversation with Copilot Studio
 *
 * POST /api/copilot/conversations
 * Protected: Requires valid Azure AD token with Momentum group membership
 *
 * Returns:
 *   {
 *     conversationId: string,
 *     token: string,
 *     expires_in: number,
 *     streamUrl: string (optional)
 *   }
 */
app.post('/api/copilot/conversations', validateAzureADToken, async (req, res) => {
  try {
    if (!COPILOT_DIRECT_LINE_SECRET) {
      return res.status(503).json({
        error: 'service_unavailable',
        error_description: 'Copilot Studio integration not configured. Missing COPILOT_DIRECT_LINE_SECRET.'
      });
    }

    console.log('[Copilot] Creating new conversation for user:', req.user.email);

    const response = await fetch(`${COPILOT_API_URL}/conversations`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${COPILOT_DIRECT_LINE_SECRET}`,
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Copilot] Failed to create conversation:', response.status, data);
      return res.status(response.status).json({
        error: 'copilot_error',
        error_description: data.error?.message || 'Failed to create Copilot conversation',
        details: data
      });
    }

    console.log('[Copilot] ✅ Conversation created:', data.conversationId);
    res.json(data);

  } catch (error) {
    console.error('[Copilot] Error creating conversation:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to create Copilot conversation',
      details: error.message
    });
  }
});

/**
 * Send a message to Copilot Studio with department context
 *
 * POST /api/copilot/messages
 * Protected: Requires valid Azure AD token with Momentum group membership
 *
 * Request Body:
 *   {
 *     conversationId: string,
 *     text: string,
 *     departmentGroup?: string,
 *     department?: string,
 *     role?: string
 *   }
 *
 * The department context is injected into channelData for the bot to use
 * in filtering search results and personalizing responses.
 */
app.post('/api/copilot/messages', validateAzureADToken, async (req, res) => {
  try {
    if (!COPILOT_DIRECT_LINE_SECRET) {
      return res.status(503).json({
        error: 'service_unavailable',
        error_description: 'Copilot Studio integration not configured. Missing COPILOT_DIRECT_LINE_SECRET.'
      });
    }

    const { conversationId, text, departmentGroup, department, role } = req.body;

    if (!conversationId || !text) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required fields: conversationId and text'
      });
    }

    console.log('[Copilot] Sending message to conversation:', conversationId);
    console.log('[Copilot] User context:', {
      email: req.user.email,
      departmentGroup,
      department,
      role
    });

    // Build the activity with department context in channelData
    const activity = {
      type: 'message',
      from: {
        id: req.user.email,
        name: req.user.name
      },
      text: text,
      channelData: {
        // Department context for Copilot Studio Power Automate flows
        userContext: {
          email: req.user.email,
          name: req.user.name,
          departmentGroup: departmentGroup || null,
          department: department || null,
          role: role || null,
          timestamp: new Date().toISOString()
        }
      }
    };

    const response = await fetch(
      `${COPILOT_API_URL}/conversations/${conversationId}/activities`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${COPILOT_DIRECT_LINE_SECRET}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity)
      }
    );

    const data = await response.json();

    if (!response.ok) {
      console.error('[Copilot] Failed to send message:', response.status, data);
      return res.status(response.status).json({
        error: 'copilot_error',
        error_description: data.error?.message || 'Failed to send message to Copilot',
        details: data
      });
    }

    console.log('[Copilot] ✅ Message sent successfully, activity ID:', data.id);
    res.json(data);

  } catch (error) {
    console.error('[Copilot] Error sending message:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to send message to Copilot',
      details: error.message
    });
  }
});

/**
 * Poll for bot responses (activities) from Copilot Studio
 *
 * GET /api/copilot/activities/:conversationId?watermark=...
 * Protected: Requires valid Azure AD token with Momentum group membership
 *
 * Query Parameters:
 *   - watermark (optional): Resume from a specific point in the conversation
 *
 * Returns:
 *   {
 *     activities: Array<Activity>,
 *     watermark: string
 *   }
 *
 * Frontend should poll this endpoint every 1-2 seconds while waiting for responses.
 */
app.get('/api/copilot/activities/:conversationId', validateAzureADToken, async (req, res) => {
  try {
    if (!COPILOT_DIRECT_LINE_SECRET) {
      return res.status(503).json({
        error: 'service_unavailable',
        error_description: 'Copilot Studio integration not configured. Missing COPILOT_DIRECT_LINE_SECRET.'
      });
    }

    const { conversationId } = req.params;
    const { watermark } = req.query;

    if (!conversationId) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing conversationId'
      });
    }

    // Build URL with optional watermark parameter
    let url = `${COPILOT_API_URL}/conversations/${conversationId}/activities`;
    if (watermark) {
      url += `?watermark=${watermark}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${COPILOT_DIRECT_LINE_SECRET}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Copilot] Failed to fetch activities:', response.status, data);
      return res.status(response.status).json({
        error: 'copilot_error',
        error_description: data.error?.message || 'Failed to fetch activities from Copilot',
        details: data
      });
    }

    // Log only if there are new activities (to reduce noise in logs)
    if (data.activities && data.activities.length > 0) {
      console.log(`[Copilot] ✅ Fetched ${data.activities.length} activities for conversation:`, conversationId);
    }

    res.json(data);

  } catch (error) {
    console.error('[Copilot] Error fetching activities:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to fetch activities from Copilot',
      details: error.message
    });
  }
});

// ==============================================================================
// Personnel Lookup - Power Automate Proxy
// ==============================================================================

/**
 * Look up personnel data by email address
 *
 * GET /api/personnel/lookup?email=user@momentumww.com
 * Protected: Requires valid Azure AD token with Momentum group membership
 *
 * Proxies request to Power Automate flow that queries Momentum personnel database.
 *
 * Returns:
 *   {
 *     success: boolean,
 *     user: {
 *       emailAddress: string,
 *       name: string,
 *       departmentGroup: string | null,
 *       department: string | null,
 *       gradeGroup: string | null,
 *       roleWithoutNumbers: string | null
 *     }
 *   }
 */
app.get('/api/personnel/lookup', validateAzureADToken, async (req, res) => {
  try {
    const { email } = req.query;

    if (!email) {
      return res.status(400).json({
        error: 'invalid_request',
        error_description: 'Missing required query parameter: email'
      });
    }

    if (!PERSONNEL_LOOKUP_FLOW_URL) {
      return res.status(503).json({
        error: 'service_unavailable',
        error_description: 'Personnel lookup not configured. Missing PERSONNEL_LOOKUP_FLOW_URL.',
        fallback: 'Use Graph API or departmentMap from frontend'
      });
    }

    console.log('[Personnel] Looking up email:', email);

    // Call Power Automate flow with same pattern as departmentService.ts
    const response = await fetch(PERSONNEL_LOOKUP_FLOW_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        action: 'lookupByEmail',
        email: email,
        timestamp: new Date().toISOString()
      }),
      signal: AbortSignal.timeout(10000) // 10 second timeout
    });

    if (!response.ok) {
      console.error('[Personnel] Lookup failed:', response.status, response.statusText);
      return res.status(response.status).json({
        error: 'personnel_lookup_failed',
        error_description: `HTTP ${response.status}: ${response.statusText}`
      });
    }

    const data = await response.json();

    if (!data.success) {
      console.warn('[Personnel] User not found:', email);
      return res.status(404).json({
        error: 'user_not_found',
        error_description: `No personnel record found for email: ${email}`
      });
    }

    console.log('[Personnel] ✅ User found:', {
      name: data.user.name || data.user.Name,
      department: data.user.departmentGroup || data.user.DepartmentGroup
    });

    // Transform Pascal Case to camelCase (same pattern as departmentService.ts)
    const transformedUser = {
      emailAddress: data.user.EmailAddress || data.user.emailAddress,
      name: data.user.Name || data.user.name,
      departmentGroup: data.user.DepartmentGroup || data.user.departmentGroup || null,
      department: data.user.Department || data.user.department || null,
      gradeGroup: data.user.GradeGroup || data.user.gradeGroup || null,
      roleWithoutNumbers: data.user.RoleWithoutNumbers || data.user.roleWithoutNumbers || null
    };

    res.json({
      success: true,
      user: transformedUser
    });

  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      console.error('[Personnel] Lookup timed out');
      return res.status(504).json({
        error: 'timeout',
        error_description: 'Personnel lookup request timed out after 10 seconds'
      });
    }

    console.error('[Personnel] Error during lookup:', error);
    res.status(500).json({
      error: 'internal_error',
      error_description: 'Failed to lookup personnel data',
      details: error.message
    });
  }
});

// ==============================================================================
// Employee Onboarding System API Routes
// ==============================================================================

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
  console.log('==============================================================================');
  console.log(`Note Crafter Backend API listening on port ${PORT}`);
  console.log('==============================================================================');
  console.log(`API Base URL: ${API_BASE_URL}`);
  console.log(`Client ID configured: ${CLIENT_ID ? 'Yes' : 'No'}`);
  console.log(`Client Secret configured: ${CLIENT_SECRET ? 'Yes' : 'No'}`);
  console.log(`Azure AD Group Security: Enabled`);
  console.log(`Required Group: MOM WW All Users 1 SG (2c08b5d8-7def-4845-a48c-740b987dcffb)`);
  console.log('');
  console.log('Momentum Knowledge Base Chatbot:');
  console.log(`  Copilot Direct Line: ${COPILOT_DIRECT_LINE_SECRET ? 'Configured ✅' : 'Not configured ⚠️'}`);
  console.log(`  Personnel Lookup: ${PERSONNEL_LOOKUP_FLOW_URL ? 'Configured ✅' : 'Not configured ⚠️'}`);
  console.log('==============================================================================');
});
