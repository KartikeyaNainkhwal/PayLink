const { OAuth2Client } = require('google-auth-library');
const { GOOGLE_CLIENT_ID, GOOGLE_CLIENT_IDS } = require('./config');

// If multiple client IDs are provided, prefer the list; otherwise fall back to single
const allowedClientIds = GOOGLE_CLIENT_IDS && GOOGLE_CLIENT_IDS.length ? GOOGLE_CLIENT_IDS : (GOOGLE_CLIENT_ID ? [GOOGLE_CLIENT_ID] : []);

// Use a single client instance (it accepts audience per-verify call)
const client = new OAuth2Client();

async function verifyGoogleToken(idToken) {
  if (!idToken) throw new Error('No id token provided');

  if (!allowedClientIds.length) {
    throw new Error('No Google client IDs configured on the server');
  }

  // Try verification against each allowed audience until one succeeds
  let ticket = null;
  let lastError = null;

  for (const aud of allowedClientIds) {
    try {
      ticket = await client.verifyIdToken({ idToken, audience: aud });
      // success
      break;
    } catch (err) {
      lastError = err;
      // continue trying other audiences
    }
  }

  if (!ticket) {
    // Provide a clearer error message that includes audience info
    const audList = allowedClientIds.join(',');
    const errMsg = lastError && lastError.message ? lastError.message : 'Failed to verify id token';
    throw new Error(`Wrong recipient, payload audience != requiredAudience. Tried audiences: ${audList}. (${errMsg})`);
  }

  const payload = ticket.getPayload();

  return {
    email: payload.email,
    emailVerified: payload.email_verified,
    firstName: payload.given_name,
    lastName: payload.family_name,
    picture: payload.picture,
    sub: payload.sub,
  };
}

module.exports = { verifyGoogleToken };
