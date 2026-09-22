// =====================================================================
// JWT secret resolution — fail closed in production.
//
// Previously app.js substituted a hardcoded fallback secret whenever
// JWT_SECRET was unset, and logged a warning. On a serverless host that
// warning goes nowhere, so a misconfigured production deploy would happily
// accept tokens signed with a secret that is published in this repository.
// Anyone could mint a token for any user id.
//
// The rule now: development may fall back, production may not.
// =====================================================================

const DEV_FALLBACK_SECRET = 'levelup_dev_only_secret_not_valid_in_production_do_not_use';

const isProduction = () => process.env.NODE_ENV === 'production';

/**
 * The secret used to sign and verify every token.
 * Throws in production when JWT_SECRET is missing, rather than silently
 * accepting forged tokens. The throw surfaces as a 500 on the first
 * authenticated request, which is loud and diagnosable — unlike the old
 * behaviour, which looked like everything was fine.
 */
export const getJwtSecret = () => {
  const secret = process.env.JWT_SECRET;
  if (secret && secret.length >= 32) return secret;

  if (isProduction()) {
    throw new Error(
      'JWT_SECRET is missing or shorter than 32 characters. Refusing to sign or ' +
      'verify tokens with a fallback secret in production. Set JWT_SECRET to a ' +
      'random 64-character string in your host environment.'
    );
  }

  if (secret) {
    console.warn('⚠️  [AUTH] JWT_SECRET is shorter than 32 characters. Using it anyway in development.');
    return secret;
  }

  console.warn('⚠️  [AUTH] JWT_SECRET is not set. Using the development-only fallback. This will refuse to start in production.');
  return DEV_FALLBACK_SECRET;
};

/** True when tokens can actually be issued/verified — used by /api/health. */
export const isJwtConfigured = () => {
  try {
    getJwtSecret();
    return true;
  } catch {
    return false;
  }
};
