const { pool } = require('./db');
const { randomToken, randomCode, sha256 } = require('./crypto-helpers');
const { sendEmail } = require('./email');

const CODE_TTL_MINUTES = 10;
const CODE_MAX_ATTEMPTS = 5;
const SESSION_TTL_DAYS = 45;
const DEVICE_TTL_DAYS = 45;

// A "challenge" is one in-flight 6-digit-code exchange — either finishing a
// login (purpose 'login') or authorizing a password change (purpose 'reset').
async function createChallenge(email, purpose) {
  const code = randomCode(6);
  const challengeToken = randomToken(24);
  const expiresAt = new Date(Date.now() + CODE_TTL_MINUTES * 60000);

  await pool.query(
    `INSERT INTO admin_login_challenges (email, code_hash, purpose, challenge_token_hash, expires_at)
     VALUES ($1, $2, $3, $4, $5)`,
    [email, sha256(code), purpose, sha256(challengeToken), expiresAt]
  );

  return { code, challengeToken, expiresAt };
}

async function sendChallengeEmail(email, code, purpose) {
  const subject = purpose === 'reset'
    ? 'Hotel 261 admin — password reset code'
    : 'Hotel 261 admin — verification code';
  const intro = purpose === 'reset'
    ? 'Use this code to reset your admin password:'
    : 'Use this code to finish signing in to the Hotel 261 admin dashboard:';

  await sendEmail({
    to: email,
    subject,
    html: `<p>${intro}</p><p style="font-size:28px;font-weight:700;letter-spacing:4px;">${code}</p><p>This code expires in ${CODE_TTL_MINUTES} minutes. If you didn&rsquo;t request this, you can ignore this email.</p>`,
    text: `${intro}\n\n${code}\n\nThis code expires in ${CODE_TTL_MINUTES} minutes. If you didn't request this, you can ignore this email.`,
  });
}

async function verifyChallenge(challengeToken, code, purpose) {
  const { rows } = await pool.query(
    `SELECT * FROM admin_login_challenges WHERE challenge_token_hash = $1 AND purpose = $2 AND consumed_at IS NULL`,
    [sha256(challengeToken), purpose]
  );
  const challenge = rows[0];

  if (!challenge) return { ok: false, error: 'This code is no longer valid. Request a new one.' };
  if (new Date(challenge.expires_at).getTime() < Date.now()) return { ok: false, error: 'This code has expired. Request a new one.' };
  if (challenge.attempts >= CODE_MAX_ATTEMPTS) return { ok: false, error: 'Too many incorrect attempts. Request a new code.' };

  if (sha256(code) !== challenge.code_hash) {
    await pool.query(`UPDATE admin_login_challenges SET attempts = attempts + 1 WHERE id = $1`, [challenge.id]);
    return { ok: false, error: 'Incorrect code.' };
  }

  await pool.query(`UPDATE admin_login_challenges SET consumed_at = NOW() WHERE id = $1`, [challenge.id]);
  return { ok: true, email: challenge.email };
}

async function createSession(email) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + SESSION_TTL_DAYS * 86400000);
  await pool.query(
    `INSERT INTO admin_sessions (email, session_token_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, sha256(token), expiresAt]
  );
  return { token, expiresAt };
}

async function findValidSession(token) {
  if (!token) return null;
  const { rows } = await pool.query(
    `SELECT * FROM admin_sessions WHERE session_token_hash = $1 AND expires_at > NOW()`,
    [sha256(token)]
  );
  return rows[0] || null;
}

async function deleteSession(token) {
  if (!token) return;
  await pool.query(`DELETE FROM admin_sessions WHERE session_token_hash = $1`, [sha256(token)]);
}

async function findTrustedDevice(email, deviceToken) {
  if (!deviceToken) return null;
  const { rows } = await pool.query(
    `SELECT * FROM admin_trusted_devices WHERE device_token_hash = $1 AND email = $2 AND expires_at > NOW()`,
    [sha256(deviceToken), email]
  );
  return rows[0] || null;
}

async function trustDevice(email) {
  const token = randomToken(32);
  const expiresAt = new Date(Date.now() + DEVICE_TTL_DAYS * 86400000);
  await pool.query(
    `INSERT INTO admin_trusted_devices (email, device_token_hash, expires_at) VALUES ($1, $2, $3)`,
    [email, sha256(token), expiresAt]
  );
  return { token, expiresAt };
}

// Called after a password reset: a changed password should force every
// device (trusted or not) to prove itself again.
async function invalidateDevicesAndSessions(email) {
  await pool.query(`DELETE FROM admin_sessions WHERE email = $1`, [email]);
  await pool.query(`DELETE FROM admin_trusted_devices WHERE email = $1`, [email]);
}

module.exports = {
  CODE_TTL_MINUTES,
  DEVICE_TTL_DAYS,
  createChallenge,
  sendChallengeEmail,
  verifyChallenge,
  createSession,
  findValidSession,
  deleteSession,
  findTrustedDevice,
  trustDevice,
  invalidateDevicesAndSessions,
};
