/**
 * Email service powered by Resend.
 * Sends transactional emails: welcome, credit warnings, alert digests, weekly summaries.
 *
 * Requires: RESEND_API_KEY environment variable.
 * Sign up at https://resend.com — free tier: 3,000 emails/month.
 */

const FROM_ADDRESS = 'PRAXIS by TACITUS <noreply@tacitus.me>';

interface EmailPayload {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

async function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  const { Resend } = await import('resend');
  return new Resend(key);
}

async function send(payload: EmailPayload): Promise<boolean> {
  try {
    const resend = await getResend();
    if (!resend) {
      console.warn('[email] RESEND_API_KEY not set — email skipped:', payload.subject);
      return false;
    }
    await resend.emails.send({ from: FROM_ADDRESS, ...payload });
    return true;
  } catch (err) {
    console.error('[email] Failed to send:', payload.subject, err);
    return false;
  }
}

// ---------------------------------------------------------------------------
// Email Templates
// ---------------------------------------------------------------------------

function baseTemplate(title: string, content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#F8FAFC">
<div style="max-width:600px;margin:0 auto;padding:40px 20px">
<div style="text-align:center;margin-bottom:32px">
  <span style="font-family:Georgia,serif;font-size:24px;font-weight:600;color:#1B3A5C;letter-spacing:0.02em">TACITUS</span>
  <span style="display:inline-block;background:#E8B931;color:#fff;font-size:10px;font-weight:700;padding:2px 8px;border-radius:12px;margin-left:8px;vertical-align:middle;letter-spacing:0.1em">PRAXIS</span>
</div>
<div style="background:#fff;border:1px solid #E2E8F0;border-radius:12px;padding:32px">
  <h1 style="margin:0 0 16px;font-size:20px;font-weight:600;color:#0F172A">${title}</h1>
  ${content}
</div>
<div style="text-align:center;margin-top:24px;color:#94A3B8;font-size:12px">
  <p>TACITUS — Conflict Intelligence for Peace & Security Professionals</p>
  <p><a href="https://praxis.tacitus.me" style="color:#1B3A5C;text-decoration:none">praxis.tacitus.me</a></p>
  <p style="margin-top:12px">
    <a href="https://praxis.tacitus.me/privacy" style="color:#94A3B8;text-decoration:none">Privacy Policy</a>
    &nbsp;&middot;&nbsp;
    <a href="https://praxis.tacitus.me/app/settings" style="color:#94A3B8;text-decoration:none">Email Preferences</a>
  </p>
</div>
</div>
</body>
</html>`;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Welcome email sent on first signup.
 */
export async function sendWelcomeEmail(email: string, name: string): Promise<boolean> {
  return send({
    to: email,
    subject: 'Welcome to PRAXIS — Your 5,000 TACITUS Credits Are Ready',
    html: baseTemplate('Welcome to PRAXIS', `
      <p style="color:#475569;line-height:1.6">Hi ${name},</p>
      <p style="color:#475569;line-height:1.6">Welcome to PRAXIS — the conflict intelligence platform by TACITUS. Your account is ready with <strong>5,000 TACITUS Credits</strong> to get started.</p>
      <p style="color:#475569;line-height:1.6">Here&apos;s what you can do:</p>
      <ul style="color:#475569;line-height:1.8;padding-left:20px">
        <li><strong>Create a situation</strong> — PRAXIS will auto-research and populate 5+ intelligence tools</li>
        <li><strong>Ask PRAXIS</strong> — AI assistant with 27 specialized conflict analysis tools</li>
        <li><strong>Generate reports</strong> — UN-standard situation reports, dossiers, and briefings</li>
        <li><strong>Monitor media</strong> — Track bias, sentiment, and narrative shifts across 50+ outlets</li>
      </ul>
      <div style="text-align:center;margin:24px 0">
        <a href="https://praxis.tacitus.me/app/assistant" style="display:inline-block;background:#E8B931;color:#0F172A;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px">Open PRAXIS</a>
      </div>
      <p style="color:#94A3B8;font-size:13px">Questions? Reply to this email or contact us at giulio@tacitus.me</p>
    `),
  });
}

/**
 * Credit warning email when balance drops below threshold.
 */
export async function sendCreditWarningEmail(
  email: string,
  name: string,
  remaining: number,
): Promise<boolean> {
  return send({
    to: email,
    subject: `Low Credits — ${remaining} TACITUS Credits Remaining`,
    html: baseTemplate('Low Credit Balance', `
      <p style="color:#475569;line-height:1.6">Hi ${name},</p>
      <p style="color:#475569;line-height:1.6">Your TACITUS Credit balance is running low. You have <strong>${remaining} credits</strong> remaining.</p>
      <p style="color:#475569;line-height:1.6">At current usage, you may run out within the next few sessions. Upgrade your plan to continue using PRAXIS without interruption.</p>
      <div style="text-align:center;margin:24px 0">
        <a href="https://praxis.tacitus.me/login?mode=signup" style="display:inline-block;background:#1B3A5C;color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px">Open PRAXIS</a>
      </div>
      <p style="color:#94A3B8;font-size:13px">Current balance: ${remaining} credits</p>
    `),
  });
}

/**
 * Alert digest email with recent intelligence alerts.
 */
export async function sendAlertDigestEmail(
  email: string,
  name: string,
  situationName: string,
  alerts: { title: string; severity: string; date: string }[],
): Promise<boolean> {
  const alertRows = alerts
    .map((a) => `<tr><td style="padding:8px;border-bottom:1px solid #F1F5F9;color:#475569;font-size:13px">${a.title}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center"><span style="background:${a.severity === 'critical' ? '#FEE2E2' : a.severity === 'high' ? '#FEF3C7' : '#E0F2FE'};color:${a.severity === 'critical' ? '#991B1B' : a.severity === 'high' ? '#92400E' : '#1E40AF'};padding:2px 8px;border-radius:4px;font-size:11px;font-weight:600">${a.severity}</span></td><td style="padding:8px;border-bottom:1px solid #F1F5F9;color:#94A3B8;font-size:12px">${a.date}</td></tr>`)
    .join('');

  return send({
    to: email,
    subject: `Intelligence Alert — ${situationName}`,
    html: baseTemplate(`Alert Digest: ${situationName}`, `
      <p style="color:#475569;line-height:1.6">Hi ${name},</p>
      <p style="color:#475569;line-height:1.6">New intelligence alerts for <strong>${situationName}</strong>:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#F8FAFC"><th style="padding:8px;text-align:left;font-size:12px;color:#64748B">Alert</th><th style="padding:8px;text-align:center;font-size:12px;color:#64748B">Severity</th><th style="padding:8px;font-size:12px;color:#64748B">Date</th></tr></thead>
        <tbody>${alertRows}</tbody>
      </table>
      <div style="text-align:center;margin:24px 0">
        <a href="https://praxis.tacitus.me/app/alerts" style="display:inline-block;background:#1B3A5C;color:#fff;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px">View Full Alert Center</a>
      </div>
    `),
  });
}

/**
 * Weekly situation summary email.
 */
export async function sendWeeklySummaryEmail(
  email: string,
  name: string,
  summary: { situationName: string; riskScore: number; trend: string; keyEvent: string }[],
): Promise<boolean> {
  const rows = summary
    .map((s) => `<tr><td style="padding:8px;border-bottom:1px solid #F1F5F9;color:#0F172A;font-weight:500;font-size:13px">${s.situationName}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;text-align:center;font-weight:700;color:${s.riskScore >= 7 ? '#DC2626' : s.riskScore >= 4 ? '#D97706' : '#059669'};font-size:13px">${s.riskScore.toFixed(1)}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#64748B">${s.trend}</td><td style="padding:8px;border-bottom:1px solid #F1F5F9;font-size:12px;color:#475569">${s.keyEvent}</td></tr>`)
    .join('');

  return send({
    to: email,
    subject: 'PRAXIS Weekly Intelligence Summary',
    html: baseTemplate('Weekly Intelligence Summary', `
      <p style="color:#475569;line-height:1.6">Hi ${name},</p>
      <p style="color:#475569;line-height:1.6">Here&apos;s your weekly situation summary from PRAXIS:</p>
      <table style="width:100%;border-collapse:collapse;margin:16px 0">
        <thead><tr style="background:#F8FAFC"><th style="padding:8px;text-align:left;font-size:12px;color:#64748B">Situation</th><th style="padding:8px;text-align:center;font-size:12px;color:#64748B">Risk</th><th style="padding:8px;font-size:12px;color:#64748B">Trend</th><th style="padding:8px;font-size:12px;color:#64748B">Key Event</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
      <div style="text-align:center;margin:24px 0">
        <a href="https://praxis.tacitus.me/app/assistant" style="display:inline-block;background:#E8B931;color:#0F172A;font-weight:600;padding:12px 32px;border-radius:8px;text-decoration:none;font-size:14px">Open PRAXIS</a>
      </div>
    `),
  });
}
