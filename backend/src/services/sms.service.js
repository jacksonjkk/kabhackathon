// Outbound SMS via Africa's Talking (alert path of the USSD story:
// sensors flag a cow -> caretaker's basic phone gets an SMS -> they dial
// the USSD code to report). Sandbox delivers only to registered test
// numbers; without AT_API_KEY this logs and skips (never throws, never
// blocks the request that triggered it).
import { env } from "../config/env.js";
import { prisma } from "../lib/prisma.js";

export async function sendSms(to, message) {
  if (!env.atApiKey) {
    if (env.nodeEnv !== "production") console.log(`[SMS skip] to=${to} msg=${message}`);
    return { sent: false, reason: "no-key" };
  }
  const body = new URLSearchParams({
    username: env.atUsername,
    to: String(to),
    message: String(message).slice(0, 160),
    ...(env.atSmsFrom ? { from: env.atSmsFrom } : {}),
  });
  const res = await fetch(`${env.atSmsUrl}/messaging`, {
    method: "POST",
    headers: { apiKey: env.atApiKey, "Content-Type": "application/x-www-form-urlencoded" },
    body,
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`AT SMS ${res.status}`);
  return { sent: true };
}

// Fire-and-forget: every farm member with a saved phone gets the warning.
// Call WITHOUT await (with .catch) so ingest latency never depends on SMS.
export function notifyFarmSms(farmId, message) {
  return (async () => {
    if (!env.atApiKey) return;
    const members = await prisma.user.findMany({
      where: { OR: [{ farmId }, { ownedFarm: { id: farmId } }], phone: { not: null } },
      select: { phone: true },
    });
    const phones = [...new Set(members.map((m) => m.phone).filter(Boolean))];
    await Promise.allSettled(phones.map((to) => sendSms(to, message)));
  })();
}
