// Thin wrapper around the Resend HTTP API (no SDK needed — it's one POST request).
// Falls back to logging the message when RESEND_API_KEY isn't set yet, so the
// 2FA/reset flow can still be built and tested locally before that's configured.
async function sendEmail({ to, subject, html, text }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Hotel 261 <onboarding@resend.dev>';

  if (!apiKey) {
    console.warn(`[email:simulated] RESEND_API_KEY not set.\nTo: ${to}\nSubject: ${subject}\n\n${text || html}\n`);
    return { ok: true, simulated: true };
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html, text }),
  });

  if (!response.ok) {
    const body = await response.text().catch(() => '');
    throw new Error(`Failed to send email (${response.status}): ${body}`);
  }

  return { ok: true };
}

module.exports = { sendEmail };
