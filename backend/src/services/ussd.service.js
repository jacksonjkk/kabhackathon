// BoviPulse USSD menu (Africa's Talking).
//
// Basic-phone caretakers get the essential loop only: report a cow's
// condition, check early warnings, cow status, help. Everything lands in
// the SAME backend (observations/alerts tables) the smartphone app uses,
// so ML features and the dashboard see USSD reports like any other note.
//
// Stateless design: AT sends the full dial path as `text` ("1*2*1*3"),
// so every screen is derived by parsing segments — no session store to
// lose on Render restarts. Keep every screen < 160 chars (one USSD page).
//
// Observation wording deliberately reuses the caretaker sign keywords the
// repro guard matches on ("not eating", "cough", "labored", ...), so a
// USSD report feeds detection exactly like an app note.
import { prisma } from "../lib/prisma.js";

const digits = (v) => String(v ?? "").replace(/\D/g, "");

// Match a caller to a user account via the phone saved in their profile
// (Settings > phone, e.g. +260971234567). AT sends E.164 too, but country
// codes may differ in formatting — compare the last 9 digits both ways.
export async function findUserByPhone(phoneNumber) {
  const d = digits(phoneNumber);
  if (d.length < 9) return null;
  const tail = d.slice(-9);
  const candidates = await prisma.user.findMany({
    where: { phone: { not: null } },
    select: { id: true, name: true, phone: true, farmId: true, role: true },
  });
  return (
    candidates.find((u) => {
      const ud = digits(u.phone);
      return ud.length >= 9 && (ud.endsWith(tail) || tail.endsWith(ud.slice(-9)));
    }) ?? null
  );
}

async function getFarm(user) {
  if (!user?.farmId) return null;
  return prisma.farm.findUnique({ where: { id: user.farmId } });
}

async function listCows(farmId) {
  return prisma.cattle.findMany({
    where: { farmId },
    orderBy: { tagNumber: "asc" },
    take: 7,
    select: { id: true, tagNumber: true, name: true },
  });
}

const CON = (s) => `CON ${s}`;
const END = (s) => `END ${s}`;
const cowLabel = (c) => c.tagNumber;

// --- report mappings (note text mirrors app-side sign keywords) ---
const APPETITE = {
  1: "Appetite normal",
  2: "Reduced appetite (off feed)",
  3: "Not eating",
};
const ACTIVITY = {
  1: "Activity normal",
  2: "Low activity, moving less",
  3: "Very low movement (possible lameness)",
};
const SYMPTOM = {
  1: "Coughing",
  2: "Diarrhea",
  3: "Lameness suspected",
  4: "Labored breathing",
};

async function saveReport({ user, cow, note }) {
  await prisma.observation.create({
    data: {
      cattleId: cow.id,
      note: `[USSD] ${note}`.slice(0, 2000),
      action: "USSD report",
      createdBy: user.id,
    },
  });
}

export async function handleUssd({ phoneNumber, text }) {
  const segs = String(text ?? "")
    .split("*")
    .map((s) => s.trim());
  const head = segs[0] || "";

  const user = await findUserByPhone(phoneNumber);
  if (!user) {
    return END(
      "Number not linked. Save this exact number in the app (Settings>Profile phone), then dial again."
    );
  }
  const farm = await getFarm(user);
  if (!farm) {
    return END("No farm linked yet. Finish setup in the app first, then dial again.");
  }

  // --- main menu ---
  if (head === "") {
    const unread = await prisma.alert.count({
      where: { farmId: farm.id, type: "HEALTH", isRead: false },
    });
    return CON(
      `BoviPulse ${farm.name.slice(0, 20)}\n1.Report cow\n2.Check alerts${unread ? `(${unread})` : ""}\n3.Cow status\n4.Help`
    );
  }

  // --- 1: report cow ---
  if (head === "1") {
    const cows = await listCows(farm.id);
    if (!cows.length) return END("No cattle registered yet. Add animals in the app first.");
    if (segs.length === 1) {
      const lines = cows.map((c, i) => `${i + 1}.${cowLabel(c)}`);
      return CON(`Report which cow?\n${lines.join("\n")}`);
    }
    const cow = cows[Number(segs[1]) - 1];
    if (!cow) return CON("Invalid choice. Dial *XXX# to start again.");
    if (segs.length === 2) {
      return CON(`${cowLabel(cow)}\n1.Appetite\n2.Activity\n3.Symptoms`);
    }
    const cat = segs[2];
    if (!["1", "2", "3"].includes(cat)) return CON("Invalid choice. Dial *XXX# to start again.");
    if (segs.length === 3) {
      if (cat === "1") return CON("Appetite\n1.Normal\n2.Reduced\n3.Not eating");
      if (cat === "2") return CON("Activity\n1.Normal\n2.Low\n3.Very low");
      return CON("Symptoms\n1.Coughing\n2.Diarrhoea\n3.Lameness\n4.Breathing\n5.Other");
    }
    // 1*n*c*o[+free text]
    const opt = segs[3];
    if (cat === "1" && APPETITE[opt]) {
      await saveReport({ user, cow, note: APPETITE[opt] });
      return END(`Saved: ${cowLabel(cow)} - ${APPETITE[opt]}. Thank you!`);
    }
    if (cat === "2" && ACTIVITY[opt]) {
      await saveReport({ user, cow, note: ACTIVITY[opt] });
      return END(`Saved: ${cowLabel(cow)} - ${ACTIVITY[opt]}. Thank you!`);
    }
    if (cat === "3" && SYMPTOM[opt]) {
      await saveReport({ user, cow, note: SYMPTOM[opt] });
      return END(`Saved: ${cowLabel(cow)} - ${SYMPTOM[opt]}. Thank you!`);
    }
    if (cat === "3" && opt === "5") {
      const free = segs.slice(4).join("*").trim().slice(0, 140);
      if (!free) return CON("Describe the symptom (type it after *):");
      await saveReport({ user, cow, note: `Other symptom: ${free}` });
      return END(`Saved for ${cowLabel(cow)}. A vet will review. Thank you!`);
    }
    return CON("Invalid choice. Dial *XXX# to start again.");
  }

  // --- 2: check alerts ---
  if (head === "2") {
    const alerts = await prisma.alert.findMany({
      where: { farmId: farm.id, type: "HEALTH", isRead: false },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { cattle: { select: { tagNumber: true } } },
    });
    if (!alerts.length) return END("No unread warnings. Herd looks calm. Good work!");
    if (segs.length === 1) {
      const lines = alerts.map(
        (a, i) => `${i + 1}.${a.cattle?.tagNumber ?? "?"} ${a.severity}`
      );
      return CON(`Unread warnings:\n${lines.join("\n")}\nReply number for detail.`);
    }
    const alert = alerts[Number(segs[1]) - 1];
    if (!alert) return CON("Invalid choice. Dial *XXX# to start again.");
    const tag = alert.cattle?.tagNumber ?? "";
    await prisma.alert.update({ where: { id: alert.id }, data: { isRead: true } });
    return END(
      `${tag} [${alert.severity}]\n${alert.message.slice(0, 100)}\nMarked checked.`
    );
  }

  // --- 3: cow status ---
  if (head === "3") {
    const cows = await listCows(farm.id);
    if (!cows.length) return END("No cattle registered yet.");
    if (segs.length === 1) {
      const lines = cows.map((c, i) => `${i + 1}.${cowLabel(c)}`);
      return CON(`Status for which cow?\n${lines.join("\n")}`);
    }
    const picked = cows[Number(segs[1]) - 1];
    if (!picked) return CON("Invalid choice. Dial *XXX# to start again.");
    const cow = await prisma.cattle.findUnique({
      where: { id: picked.id },
      include: {
        thermalReadings: { orderBy: { capturedAt: "desc" }, take: 1 },
      },
    });
    const r = cow?.thermalReadings?.[0];
    const temp = r ? `${r.temperatureC}C` : "no data";
    const ml = r?.prediction ? ` ML:${r.prediction}` : "";
    return END(`${cowLabel(cow)} ${cow?.name ?? ""}\nTemp ${temp}${ml}\nHerd: ${cow?.healthStatus}`);
  }

  // --- 4: help ---
  if (head === "4") {
    return END("BoviPulse: report signs, check warnings, view cow status. Same data as the app. Ask your vet for help.");
  }

  return CON("Invalid choice.\n1.Report cow\n2.Check alerts\n3.Cow status\n4.Help");
}
