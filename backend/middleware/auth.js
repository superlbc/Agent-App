const jwt = require('jsonwebtoken');
const jwksClient = require('jwks-rsa');

// Azure AD Configuration
const TENANT_ID = 'd026e4c1-5892-497a-b9da-ee493c9f0364';
const REQUIRED_GROUP_ID = '2c08b5d8-7def-4845-a48c-740b987dcffb'; // MOM WW All Users 1 SG

// JWKS client to fetch Azure AD public keys for token verification
const client = jwksClient({
  jwksUri: `https://login.microsoftonline.com/${TENANT_ID}/discovery/v2.0/keys`,
  cache: true,
  cacheMaxAge: 86400000, // 24 hours
  rateLimit: true,
  jwksRequestsPerMinute: 10
});

// Helper function to get the signing key from Azure AD
function getKey(header, callback) {
  client.getSigningKey(header.kid, (err, key) => {
    if (err) {
      console.error('Error fetching signing key:', err);
      return callback(err);
    }
    const signingKey = key.getPublicKey();
    callback(null, signingKey);
  });
}

// Middleware to validate Azure AD JWT tokens and check group membership
function validateAzureADToken(req, res, next) {
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.warn('Authorization header missing or invalid');
    return res.status(401).json({
      error: 'unauthorized',
      error_description: 'Authorization header with Bearer token is required'
    });
  }

  const token = authHeader.substring(7); // Remove "Bearer " prefix

  // Verify the token
  jwt.verify(
    token,
    getKey,
    {
      audience: '5fa64631-ea56-4676-b6d5-433d322a4da1', // Client ID
      issuer: `https://login.microsoftonline.com/${TENANT_ID}/v2.0`,
      algorithms: ['RS256']
    },
    (err, decoded) => {
      if (err) {
        console.error('Token verification failed:', err.message);
        return res.status(401).json({
          error: 'unauthorized',
          error_description: 'Invalid or expired token'
        });
      }

      // Token is valid, now check group membership
      const groups = decoded.groups;

      if (!groups || !Array.isArray(groups)) {
        console.warn('Groups claim not found in token for user:', decoded.preferred_username);
        return res.status(403).json({
          error: 'forbidden',
          error_description: 'User is not authorized to access this application. Groups claim missing.'
        });
      }

      // Check if user is in the required Momentum group
      if (!groups.includes(REQUIRED_GROUP_ID)) {
        console.warn('User not in required group:', {
          user: decoded.preferred_username,
          userGroups: groups,
          requiredGroup: REQUIRED_GROUP_ID
        });
        return res.status(403).json({
          error: 'forbidden',
          error_description: 'User is not authorized to access this application. This application is only accessible to Momentum Worldwide users.'
        });
      }

      // User is authenticated and authorized
      console.log('User authorized:', decoded.preferred_username);

      // Attach user info to request for downstream use
      req.user = {
        email: decoded.preferred_username,
        name: decoded.name,
        oid: decoded.oid,
        groups: groups
      };

      next();
    }
  );
}

module.exports = { validateAzureADToken };
