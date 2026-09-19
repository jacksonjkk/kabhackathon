// Email alerts via SMTP relay (Brevo smtp-relay.brevo.com:587).
//
// Sends a plain-text + HTML email to every farm member (owner included)
// with alertsEnabled=true whenever a HEALTH alert is created or escalated.
// Fire-and-forget by design: failures are logged, never thrown, so a mail
// outage can never break readings ingestion. Empty SMTP_HOST/USER/PASS
// disables sending (in-app alerts keep working).
import nodemailer from "nodemailer";
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export const emailEnabled = () =>
  Boolean(env.smtpHost && env.smtpUser && env.smtpPass);

let transporter = null;
function getTransporter() {
  if (!emailEnabled()) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtpHost,
      port: env.smtpPort,
      secure: env.smtpPort === 465, // 587 (Brevo) uses STARTTLS, not implicit TLS
      auth: { user: env.smtpUser, pass: env.smtpPass },
    });
  }
  return transporter;
}

export async function sendAlertEmail({ to, subject, text, html }) {
  const tx = getTransporter();
  if (!tx) return null;
  return tx.sendMail({ from: env.emailFrom, to, subject, text, html });
}

// Notify the farm about a created/escalated HEALTH alert. Never throws.
export async function notifyFarmAlert({ farm, alert, cattleTag }) {
  try {
    const tx = getTransporter();
    if (!tx) return null;
    const recipients = await prisma.user.findMany({
      where: {
        alertsEnabled: true,
        OR: [{ farmId: farm.id }, { id: farm.ownerId }],
      },
      select: { email: true },
    });
    const to = [...new Set(recipients.map((r) => r.email).filter(Boolean))];
    if (to.length === 0) return null;

    const subject = `[BoviPulse] ${alert.severity} — ${alert.title}`;
    const text =
      `${alert.title}\n` +
      `Severity: ${alert.severity} (source: ${alert.source})\n` +
      (cattleTag ? `Animal: ${cattleTag}\n` : "") +
      `\n${alert.message}\n` +
      `\n— BoviPulse early warning (not a diagnosis)`;
    const html =
      `<h2>${escapeHtml(alert.title)}</h2>` +
      `<p><strong>Severity:</strong> ${escapeHtml(alert.severity)} ` +
      `(source: ${escapeHtml(alert.source)})</p>` +
      (cattleTag ? `<p><strong>Animal:</strong> ${escapeHtml(cattleTag)}</p>` : "") +
      `<p>${escapeHtml(alert.message)}</p>` +
      `<p><em>— BoviPulse early warning (not a diagnosis)</em></p>`;

    return await sendAlertEmail({ to, subject, text, html });
  } catch (err) {
    console.error(`[email] alert notification failed: ${err?.message ?? err}`);
    return null;
  }
}

function escapeHtml(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]),
  );
}
