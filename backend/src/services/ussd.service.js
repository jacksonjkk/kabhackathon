// BoviPulse USSD menu (Africa's Talking).
//
// Basic-phone caretakers get the essential loop only: report a cow's
// condition, check early warnings, cow status, help, language. Everything
// lands in the SAME backend (observations/alerts tables) the smartphone app
// uses, so ML features and the dashboard see USSD reports like any other note.
//
// Stateless design: AT sends the full dial path as `text` ("1*2*1*3"),
// so every screen is derived by parsing segments — no session store to
// lose on Render restarts. Keep every screen < 160 chars (one USSD page).
//
// Languages: menu chrome is translated (en/sw/lg/nyn, mirroring the app
// picker; lg/nyn wording is draft pending native-speaker review, same as
// the app). Saved observation notes STAY in English keywords on purpose:
// the repro guard matches on those tokens ("not eating", "cough",
// "labored", ...), so a USSD report feeds detection exactly like an app note.
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
    select: { id: true, name: true, phone: true, farmId: true, role: true, language: true },
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

// Short stamp in East Africa Time, e.g. "19/9 22:50" — lets caretakers tell
// fresh warnings from stale unread ones at a glance. Language-neutral digits.
const eatStamp = (d) => {
  const t = new Date(new Date(d).getTime() + 3 * 3_600_000);
  const p = (n) => String(n).padStart(2, "0");
  return `${t.getUTCDate()}/${t.getUTCMonth() + 1} ${p(t.getUTCHours())}:${p(t.getUTCMinutes())}`;
};

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

// --- menu chrome per language (short: every screen < 160 chars) ---
const LANG_OPTIONS = { 1: "en", 2: "sw", 3: "lg", 4: "nyn" };
const LANG_NAMES = { en: "English", sw: "Kiswahili", lg: "Luganda", nyn: "Runyankole" };
const STR = {
  en: {
    m1: "Report cow", m2: "Check alerts", m3: "Cow status", m4: "Help", m5: "Language",
    reportWhich: "Report which cow?",
    cat: (cow) => `${cow}\n1.Appetite\n2.Activity\n3.Symptoms`,
    appetite: "Appetite\n1.Normal\n2.Reduced\n3.Not eating",
    activity: "Activity\n1.Normal\n2.Low\n3.Very low",
    symptoms: "Symptoms\n1.Coughing\n2.Diarrhoea\n3.Lameness\n4.Breathing\n5.Other",
    saved: (cow, opt) => `Saved: ${cow} - ${opt}. Thank you!`,
    freePrompt: "Describe the symptom (type it after *):",
    otherSaved: (cow) => `Saved for ${cow}. A vet will review. Thank you!`,
    alertsNone: "No unread warnings. Herd looks calm. Good work!",
    alertsList: "Unread warnings:",
    alertsHint: "Reply number.",
    checked: "Marked checked.",
    cowWhich: "Status for which cow?",
    noData: "no data",
    herd: "Herd",
    help: "BoviPulse: report signs, check warnings, view cow status. Same data as the app. Ask your vet for help.",
    notLinked: "Number not linked. Save this exact number in the app (Settings>Profile phone), then dial again.",
    noFarm: "No farm linked yet. Finish setup in the app first, then dial again.",
    noCattle: "No cattle registered yet. Add animals in the app first.",
    invalid: "Invalid choice. Dial *XXX# to start again.",
    langPrompt: "Language\n1.English\n2.Kiswahili\n3.Luganda\n4.Runyankole",
    langSaved: (name) => `Language saved: ${name}. Thank you!`,
    healthy: "HEALTHY",
  },
  sw: {
    m1: "Ripoti ng'ombe", m2: "Maonyo", m3: "Hali", m4: "Msaada", m5: "Lugha",
    reportWhich: "Ripoti ng'ombe ipi?",
    cat: (cow) => `${cow}\n1.Chakula\n2.Shughuli\n3.Dalili`,
    appetite: "Chakula\n1.Kawaida\n2.Kidogo\n3.Hataki",
    activity: "Shughuli\n1.Kawaida\n2.Chini\n3.Chini sana",
    symptoms: "Dalili\n1.Kukohoa\n2.Kuhara\n3.Kuchechea\n4.Kupumua\n5.Nyingine",
    saved: (cow, opt) => `Imerekodiwa: ${cow} - ${opt}. Asante!`,
    freePrompt: "Eleza dalili (andika baada ya *):",
    otherSaved: (cow) => `Imerekodiwa kwa ${cow}. Daktari ataona. Asante!`,
    alertsNone: "Hakuna maonyo. Kundi linaonekana shwari. Kazi nzuri!",
    alertsList: "Maonyo:",
    alertsHint: "Jibu namba kwa maelezo.",
    checked: "Imekaguliwa.",
    cowWhich: "Hali ya ng'ombe ipi?",
    noData: "hakuna data",
    herd: "Kundi",
    help: "BoviPulse: ripoti dalili, angalia maonyo. Data sawa na app. Muulize daktari.",
    notLinked: "Namba haijaunganishwa. Hifadhi namba hii kwenye app, piga tena.",
    noFarm: "Hakuna shamba. Maliza usajili kwenye app.",
    noCattle: "Hakuna ng'ombe. Sajili kwenye app.",
    invalid: "Chaguo batili. Piga tena.",
    langPrompt: "Lugha\n1.English\n2.Kiswahili\n3.Luganda\n4.Runyankole",
    langSaved: (name) => `Lugha imehifadhiwa: ${name}. Asante!`,
    healthy: "MZIMA",
  },
  lg: {
    m1: "Ripota ente", m2: "Okulabula", m3: "Embeera", m4: "Obuyambi", m5: "Olulimi",
    reportWhich: "Ripota nte ki?",
    cat: (cow) => `${cow}\n1.Emmere\n2.Entambula\n3.Obubonero`,
    appetite: "Emmere\n1.Bulungi\n2.Tono\n3.Terira",
    activity: "Entambula\n1.Bulungi\n2.Tono\n3.Tono nyo",
    symptoms: "Obubonero\n1.Okukolola\n2.Ekidukano\n3.Okuchechea\n4.Okussa\n5.Ekirala",
    saved: (cow, opt) => `Kiwandiikiddwa: ${cow} - ${opt}. Webale!`,
    freePrompt: "Nyonyola akabonero (wandika):",
    otherSaved: (cow) => `Kiwandiikiddwa ku ${cow}. Omusawo alaba. Webale!`,
    alertsNone: "Tewali kulabula. Ekisibo kirungi. Webale!",
    alertsList: "Okulabula:",
    alertsHint: "Ddamu namba.",
    checked: "Kekebereddwa.",
    cowWhich: "Embeera ya nte ki?",
    noData: "tewali data",
    herd: "Ekisibo",
    help: "BoviPulse: ripota obubonero, kebera okulabula. Data y'emu ne app.",
    notLinked: "Namba tegatta. Tereka namba eno mu app, ddamu okukuba.",
    noFarm: "Tewali faamu. Maliriza mu app.",
    noCattle: "Tewali nte. Yongeza mu app.",
    invalid: "Okulonda tekutuufu. Ddamu okukuba.",
    langPrompt: "Olulimi\n1.English\n2.Kiswahili\n3.Luganda\n4.Runyankole",
    langSaved: (name) => `Olulimi luterekeddwa: ${name}. Webale!`,
    healthy: "NNUNGI",
  },
  nyn: {
    m1: "Handiika ente", m2: "Okurabura", m3: "Embeera", m4: "Obuhwezi", m5: "Orurimi",
    reportWhich: "Handiika ente ki?",
    cat: (cow) => `${cow}\n1.Ebyokurya\n2.Okutambura\n3.Obumanyiso`,
    appetite: "Ebyokurya\n1.Bulungi\n2.Bike\n3.Tarikurya",
    activity: "Okutambura\n1.Bulungi\n2.Buke\n3.Buke munonga",
    symptoms: "Obumanyiso\n1.Okukorora\n2.Ekidukano\n3.Okukonka\n4.Okussa\n5.Ekindi",
    saved: (cow, opt) => `Kyahandiikirwe: ${cow} - ${opt}. Webare!`,
    freePrompt: "Shoborora akabonero (handiika):",
    otherSaved: (cow) => `Kyahandiikirwe aha ${cow}. Omushaho areeba. Webare!`,
    alertsNone: "Tihariho kurabura. Ekiibo nikirungi. Webare!",
    alertsList: "Okurabura:",
    alertsHint: "Garukamu namba.",
    checked: "Kyarindwa.",
    cowWhich: "Embeera y'ente ki?",
    noData: "tihariho data",
    herd: "Ekiibo",
    help: "BoviPulse: handiika obumanyiso, reeba okurabura. Data n'emwe nka app.",
    notLinked: "Namba teyahikanisibwe. Bika namba egi omu app, oteere wire.",
    noFarm: "Tihariho faamu. Heza omu app.",
    noCattle: "Tihariho nte. Yongeramu omu app.",
    invalid: "Okutorana tikuhikire. Oteere wire.",
    langPrompt: "Orurimi\n1.English\n2.Kiswahili\n3.Luganda\n4.Runyankole",
    langSaved: (name) => `Orurimi rwabikwa: ${name}. Webare!`,
    healthy: "NZIMA",
  },
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
  const S = STR[user.language] ?? STR.en;

  // --- main menu ---
  if (head === "") {
    const unread = await prisma.alert.count({
      where: { farmId: farm.id, type: "HEALTH", isRead: false },
    });
    return CON(
      `BoviPulse - ${farm.name.slice(0, 20)}\n1.${S.m1}\n2.${S.m2}${unread ? `(${unread})` : ""}\n3.${S.m3}\n4.${S.m4}\n5.${S.m5}`
    );
  }

  // --- 1: report cow ---
  if (head === "1") {
    const cows = await listCows(farm.id);
    if (!cows.length) return END(S.noCattle);
    if (segs.length === 1) {
      const lines = cows.map((c, i) => `${i + 1}.${cowLabel(c)}`);
      return CON(`${S.reportWhich}\n${lines.join("\n")}`);
    }
    const cow = cows[Number(segs[1]) - 1];
    if (!cow) return CON(S.invalid);
    if (segs.length === 2) {
      return CON(S.cat(cowLabel(cow)));
    }
    const cat = segs[2];
    if (!["1", "2", "3"].includes(cat)) return CON(S.invalid);
    if (segs.length === 3) {
      if (cat === "1") return CON(S.appetite);
      if (cat === "2") return CON(S.activity);
      return CON(S.symptoms);
    }
    // 1*n*c*o[+free text]
    const opt = segs[3];
    if (cat === "1" && APPETITE[opt]) {
      await saveReport({ user, cow, note: APPETITE[opt] });
      return END(S.saved(cowLabel(cow), APPETITE[opt]));
    }
    if (cat === "2" && ACTIVITY[opt]) {
      await saveReport({ user, cow, note: ACTIVITY[opt] });
      return END(S.saved(cowLabel(cow), ACTIVITY[opt]));
    }
    if (cat === "3" && SYMPTOM[opt]) {
      await saveReport({ user, cow, note: SYMPTOM[opt] });
      return END(S.saved(cowLabel(cow), SYMPTOM[opt]));
    }
    if (cat === "3" && opt === "5") {
      const free = segs.slice(4).join("*").trim().slice(0, 140);
      if (!free) return CON(S.freePrompt);
      await saveReport({ user, cow, note: `Other symptom: ${free}` });
      return END(S.otherSaved(cowLabel(cow)));
    }
    return CON(S.invalid);
  }

  // --- 2: check alerts ---
  if (head === "2") {
    const alerts = await prisma.alert.findMany({
      where: { farmId: farm.id, type: "HEALTH", isRead: false },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { cattle: { select: { tagNumber: true } } },
    });
    if (!alerts.length) return END(S.alertsNone);
    if (segs.length === 1) {
      const lines = alerts.map(
        (a, i) => `${i + 1}.${a.cattle?.tagNumber ?? "?"} ${a.severity} ${eatStamp(a.createdAt)}`
      );
      return CON(`${S.alertsList}\n${lines.join("\n")}\n${S.alertsHint}`);
    }
    const alert = alerts[Number(segs[1]) - 1];
    if (!alert) return CON(S.invalid);
    const tag = alert.cattle?.tagNumber ?? "";
    await prisma.alert.update({ where: { id: alert.id }, data: { isRead: true } });
    return END(
      `${tag} [${alert.severity}] ${eatStamp(alert.createdAt)}\n${alert.message.slice(0, 85)}\n${S.checked}`
    );
  }

  // --- 3: cow status ---
  if (head === "3") {
    const cows = await listCows(farm.id);
    if (!cows.length) return END(S.noCattle);
    if (segs.length === 1) {
      const lines = cows.map((c, i) => `${i + 1}.${cowLabel(c)}`);
      return CON(`${S.cowWhich}\n${lines.join("\n")}`);
    }
    const picked = cows[Number(segs[1]) - 1];
    if (!picked) return CON(S.invalid);
    const cow = await prisma.cattle.findUnique({
      where: { id: picked.id },
      include: {
        thermalReadings: { orderBy: { capturedAt: "desc" }, take: 1 },
      },
    });
    const r = cow?.thermalReadings?.[0];
    const temp = r ? `${r.temperatureC}C` : S.noData;
    const ml = r?.prediction ? ` ML:${r.prediction}` : "";
    const health = cow?.healthStatus === "HEALTHY" ? S.healthy : (cow?.healthStatus ?? "");
    return END(`${cowLabel(cow)} ${cow?.name ?? ""}\nTemp ${temp}${ml}\n${S.herd}: ${health}`);
  }

  // --- 4: help ---
  if (head === "4") {
    return END(S.help);
  }

  // --- 5: language ---
  if (head === "5") {
    if (segs.length === 1) {
      return CON(S.langPrompt);
    }
    const code = LANG_OPTIONS[segs[1]];
    if (!code) return CON(S.invalid);
    await prisma.user.update({ where: { id: user.id }, data: { language: code } });
    return END(STR[code].langSaved(LANG_NAMES[code]));
  }

  return CON(`Invalid choice.\n1.${S.m1}\n2.${S.m2}\n3.${S.m3}\n4.${S.m4}\n5.${S.m5}`);
}
