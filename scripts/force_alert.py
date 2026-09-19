"""Force one animal into a guaranteed alert + email.

Posts a rising fever ramp (39.2 -> 40.6C, collapsed activity) as successive
readings, so BOTH judges fire: the temperature safety net (>= 39.5 HIGH,
>= 40.3 CRITICAL) AND the AI (sustained deviation from the cow's own
baseline, not a lone spike it can smooth over). The first reading that
crosses the line creates the alert and the email; repeats are silenced
by the 6-hour cooldown, so use a cow with no recent warning of the
same kind (default SIM-004).

Usage:
  python force_alert.py --email you@farm.com --password secret \
      --base-url https://kabhackathon.onrender.com --tag SIM-004
"""
from __future__ import annotations

import argparse
import time
from datetime import datetime, timedelta, timezone

from simulate_iot import API

START_TEMP = 39.2
END_TEMP = 40.6
ACTIVITY = 5.0
POINTS = 8
STEP_MIN = 15


def main():
    ap = argparse.ArgumentParser(description="Force a guaranteed alert + email")
    ap.add_argument("--email", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--base-url", default="http://localhost:4000")
    ap.add_argument("--tag", default="SIM-004")
    ap.add_argument("--points", type=int, default=POINTS)
    ap.add_argument("--start-temp", type=float, default=START_TEMP)
    ap.add_argument("--end-temp", type=float, default=END_TEMP,
                    help="final temp; 41.5 = near-death critical")
    ap.add_argument("--activity", type=float, default=ACTIVITY,
                    help="movement level; ~1 = immobile")
    ap.add_argument("--span-hours", type=float, default=None,
                    help="spread readings over this many hours (fills the model's "
                         "6h/24h windows with abnormal data so the AI fires too)")
    args = ap.parse_args()

    api = API(args.base_url)
    api.login(args.email, args.password)
    cows = api.get("/cattle", {"limit": 100})["data"]
    match = [c for c in cows if c.get("tagNumber") == args.tag]
    if not match:
        print(f"No cow with tag {args.tag}")
        return
    cow = match[0]

    print(f"Driving {args.tag} into fever ({args.points} readings, "
          f"{args.start_temp}->{args.end_temp}C, activity collapsed):")
    now = datetime.now(timezone.utc)
    span_min = args.span_hours * 60 if args.span_hours else STEP_MIN * (args.points - 1)
    emailed = False
    for i in range(args.points):
        temp = round(args.start_temp + (args.end_temp - args.start_temp) * i / max(args.points - 1, 1), 2)
        ts = (now - timedelta(minutes=span_min * (args.points - 1 - i) / max(args.points - 1, 1))).isoformat()
        res = api.send_reading({
            "cattleId": cow["id"],
            "temperatureC": temp,
            "activityLevel": args.activity,
            "deviceId": "FORCE-ALERT",
            "capturedAt": ts,
        })
        print(f"  {temp}C -> prediction={res.get('prediction')} "
              f"score={res.get('anomalyScore')} risk={res.get('riskLevel')} "
              f"alertCreated={res.get('alertCreated')}")
        emailed = emailed or bool(res.get("alertCreated"))
        time.sleep(0.5)

    if emailed:
        print("\nAlert fired — email is on its way. Check the inbox (and spam).")
    else:
        print("\nNo new alert — a same-titled warning fired within the last 6h "
              "(cooldown), or the message was deduplicated. "
              "Use a cow with no recent warning, or wait the cooldown out.")


if __name__ == "__main__":
    main()
