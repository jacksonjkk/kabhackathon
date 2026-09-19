// Africa's Talking USSD callback. AT posts form-urlencoded:
//   sessionId, serviceCode, phoneNumber, text ("1*2*1")
// Reply must be text/plain starting with CON (continue) or END (hang up).
// Public route (AT can't send JWT) — identity comes from the caller's
// phone number matched to a profile phone in ussd.service.js.
import { handleUssd } from "../services/ussd.service.js";

export const ussdCallback = async (req, res) => {
  const { sessionId, serviceCode, phoneNumber, text } = req.body ?? {};
  try {
    const reply = await handleUssd({ phoneNumber, text: text ?? "" });
    res.set("Content-Type", "text/plain").status(200).send(reply);
  } catch (err) {
    console.error(`[USSD ${sessionId} ${serviceCode}]`, err?.message ?? err);
    res
      .set("Content-Type", "text/plain")
      .status(200)
      .send("END Service error. Please try again in a minute.");
  }
};

// Browser-friendly check (AT itself only uses POST).
export const ussdHealth = (_req, res) => {
  res.set("Content-Type", "text/plain").status(200).send("END BoviPulse USSD is live. Dial your service code.");
};
