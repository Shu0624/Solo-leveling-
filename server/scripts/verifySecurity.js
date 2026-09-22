// =====================================================================
// LevelUp — Security regression checks
//
// Exercises the access-control logic that guards student records. Runs
// without a database or network so it can be used as a pre-deploy gate.
//   npm run verify:security
// =====================================================================
import assert from 'assert';

process.env.NODE_ENV = 'production';

let passed = 0;
const results = [];
// MUST await fn(). When this was synchronous it called an async assertion,
// got a pending promise back, and recorded a pass — so every asynchronous
// check in this file reported green regardless of what it asserted.
const check = async (name, fn) => {
  try {
    await fn();
    results.push(`  ✓ ${name}`);
    passed++;
  } catch (err) {
    results.push(`  ✗ ${name}\n      ${err.message}`);
  }
};

// ---------------------------------------------------------------------
// 1. JWT secret must fail closed in production
// ---------------------------------------------------------------------
const { getJwtSecret, isJwtConfigured } = await import('../config/jwt.js');

await check('production without JWT_SECRET refuses to produce a secret', () => {
  delete process.env.JWT_SECRET;
  assert.throws(() => getJwtSecret(), /JWT_SECRET is missing/);
  assert.strictEqual(isJwtConfigured(), false);
});

await check('production rejects a JWT_SECRET shorter than 32 chars', () => {
  process.env.JWT_SECRET = 'short';
  assert.throws(() => getJwtSecret());
});

await check('production accepts a strong JWT_SECRET', () => {
  process.env.JWT_SECRET = 'x'.repeat(64);
  assert.strictEqual(getJwtSecret().length, 64);
});

// ---------------------------------------------------------------------
// 2. CORS allowlist must actually reject
// ---------------------------------------------------------------------
const { isOriginAllowed } = await import('../config/cors.js');

await check('CORS rejects an unrelated origin', () => {
  assert.strictEqual(isOriginAllowed('https://attacker.example'), false);
});

await check('CORS rejects a vercel.app suffix-lookalike domain', () => {
  // `origin.endsWith('.vercel.app')` on the raw string would have allowed this.
  assert.strictEqual(isOriginAllowed('https://evil.vercel.app.attacker.com'), false);
});

await check('CORS allows a genuine Vercel preview host', () => {
  assert.strictEqual(isOriginAllowed('https://levelup-abc123.vercel.app'), true);
});

await check('CORS does not allow localhost in production', () => {
  delete process.env.CLIENT_URL;
  assert.strictEqual(isOriginAllowed('http://localhost:5173'), false);
});

await check('CORS allows an explicitly configured CLIENT_URL', () => {
  process.env.CLIENT_URL = 'https://levelup.example.edu';
  assert.strictEqual(isOriginAllowed('https://levelup.example.edu'), true);
  assert.strictEqual(isOriginAllowed('https://other.example.edu'), false);
});

await check('CORS rejects a malformed origin', () => {
  assert.strictEqual(isOriginAllowed('not-a-url'), false);
});

// ---------------------------------------------------------------------
// 3. Staff roles cannot be self-assigned
// ---------------------------------------------------------------------
const { checkStaffSignup, saveWithUniqueId } = await import('../controllers/authController.js');

await check('student role needs no access code', () => {
  delete process.env.STAFF_SIGNUP_CODE;
  assert.strictEqual(checkStaffSignup('student', undefined).ok, true);
});

await check('staff self-registration is refused when no code is configured', () => {
  delete process.env.STAFF_SIGNUP_CODE;
  for (const role of ['faculty', 'hod', 'principal', 'placement']) {
    assert.strictEqual(checkStaffSignup(role, 'anything').ok, false, `${role} was allowed`);
  }
});

await check('staff role is refused without the code', () => {
  process.env.STAFF_SIGNUP_CODE = 'correct-horse-battery-staple';
  assert.strictEqual(checkStaffSignup('principal', undefined).ok, false);
  assert.strictEqual(checkStaffSignup('principal', '').ok, false);
});

await check('staff role is refused with a wrong code', () => {
  process.env.STAFF_SIGNUP_CODE = 'correct-horse-battery-staple';
  assert.strictEqual(checkStaffSignup('principal', 'guess').ok, false);
  // a prefix of the real code must not pass
  assert.strictEqual(checkStaffSignup('principal', 'correct-horse').ok, false);
});

await check('staff role is accepted with the exact code', () => {
  process.env.STAFF_SIGNUP_CODE = 'correct-horse-battery-staple';
  assert.strictEqual(checkStaffSignup('principal', 'correct-horse-battery-staple').ok, true);
  assert.strictEqual(checkStaffSignup('faculty', 'correct-horse-battery-staple').ok, true);
});

// ---------------------------------------------------------------------
// 4. Unique-ID retry survives a duplicate-key race
// ---------------------------------------------------------------------
const duplicateKeyError = (field) => {
  const err = new Error('E11000 duplicate key error');
  err.code = 11000;
  err.keyValue = { [field]: 'CSE-2026-001' };
  return err;
};

await check('a duplicate enrollmentId is retried with the next sequence', async () => {
  let calls = 0;
  const result = await saveWithUniqueId(
    (attempt) => `CSE-2026-00${attempt + 1}`,
    (id) => {
      calls++;
      if (calls < 3) throw duplicateKeyError('enrollmentId');
      return Promise.resolve({ enrollmentId: id });
    }
  );
  assert.strictEqual(calls, 3);
  assert.strictEqual(result.enrollmentId, 'CSE-2026-003');
});

await check('a non-duplicate error is not swallowed by the retry', async () => {
  await assert.rejects(
    saveWithUniqueId(() => 'X-1', () => { throw new Error('database is on fire'); }),
    /database is on fire/
  );
});

await check('a duplicate on an unrelated field is not retried', async () => {
  const emailClash = new Error('E11000');
  emailClash.code = 11000;
  emailClash.keyValue = { email: 'a@b.c' };
  await assert.rejects(
    saveWithUniqueId(() => 'X-1', () => { throw emailClash; }),
    (err) => err.code === 11000
  );
});

// ---------------------------------------------------------------------
// 5. Login must never mint a session for an unverified password
// ---------------------------------------------------------------------
// A previous revision fell back to generating a synthetic session from the
// email address whenever the database lookup did not produce a match — which
// also fired on a healthy database for any unregistered address. The role was
// taken from the email string, so `principal@anything.com` signed in as a
// principal with any password, including an empty one.
{
  process.env.NODE_ENV = 'production';
  process.env.JWT_SECRET = 'x'.repeat(64);
  delete process.env.ALLOW_DEMO_LOGIN;
  delete process.env.MONGO_URI;

  const { default: app } = await import('../app.js');
  const http = await import('http');
  const server = http.createServer(app);
  await new Promise((r) => server.listen(0, r));
  const base = `http://127.0.0.1:${server.address().port}`;

  const login = (email, password) =>
    fetch(`${base}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }).then(async (r) => ({ status: r.status, body: await r.json().catch(() => ({})) }));

  // Kept under the 10-per-15-minute login limiter.
  const probes = [
    ['principal@gmail.com', 'anything'],
    ['some-hod@outlook.com', ''],
    ['x-placement@mailinator.com', 'x'],
  ];

  for (const [email, password] of probes) {
    await check(`login refuses an unverified session for ${email}`, async () => {
      const res = await login(email, password);
      assert.notStrictEqual(res.status, 200, `got 200 with role=${res.body.role}`);
      assert.ok(!res.body.token, 'a token was issued without verifying a password');
      assert.ok(!res.body.role, `a role (${res.body.role}) was assigned from the email`);
    });
  }

  await check('demo allowlist is refused in production by default', async () => {
    const res = await login('principal@demo.com', 'n/a');
    assert.notStrictEqual(res.status, 200);
  });

  server.close();
}

console.log('\nLevelUp security checks\n');
console.log(results.join('\n'));
const total = results.length;
console.log(`\n${passed}/${total} passed\n`);
process.exit(passed === total ? 0 : 1);
