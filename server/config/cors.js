// =====================================================================
// Shared cross-origin policy.
//
// Express and Socket.io each had their own origin function, and both ended
// in `callback(null, true)` — an allowlist that allowed everything. They now
// share one implementation so the two can't drift apart again.
// =====================================================================

// Read lazily so tests and serverless cold starts see the current environment
// rather than whatever was set at first import.
const isProduction = () => process.env.NODE_ENV === 'production';

// The dev default is localhost. Production has no default: an unset CLIENT_URL
// there means "same-origin only", which is exactly right for the Vercel deploy
// where the API and the client share a domain. Baking localhost into the
// production allowlist would hand every developer machine a standing pass.
const getAllowedOrigins = () => {
  const configured = process.env.CLIENT_URL;
  if (configured) {
    return configured.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return isProduction() ? [] : ['http://localhost:5173'];
};

// Localhost is a legitimate origin while developing, but should not be waved
// through by a production deployment.
const allowLocalhost = () => !isProduction();

export const isOriginAllowed = (origin) => {
  // Same-origin and non-browser callers (curl, server-to-server) send no Origin.
  if (!origin) return true;

  let hostname;
  try {
    hostname = new URL(origin).hostname;
  } catch {
    return false;
  }

  if (getAllowedOrigins().includes(origin)) return true;

  // Match on the parsed *hostname*. A substring test against the raw origin
  // would also have accepted `https://evil.vercel.app.attacker.com`.
  if (hostname === 'vercel.app' || hostname.endsWith('.vercel.app')) return true;

  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';
  return allowLocalhost() && isLocalhost;
};

/** cors-package-shaped callback wrapper. */
export const corsOrigin = (origin, callback) => (
  isOriginAllowed(origin)
    ? callback(null, true)
    : callback(new Error('Not allowed by CORS'))
);

export { getAllowedOrigins };
