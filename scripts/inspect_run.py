"""Inspect what the backend actually saw — no more blind runs.

Shows per cow: readings count, max body temp, latest ML verdict, and
unread HEALTH alerts. Optionally injects one deterministic 40.5C reading
for a tag to force a CRITICAL alert + email (proves the notify path).

Usage:
  python inspect_run.py --email you@farm.com --password secret --base-url https://kabhackathon.onrender.com
  python inspect_run.py --email you@farm.com --password secret --base-url https://kabhackathon.onrender.com --fever SIM-003
"""
from __future__ import annotations

import argparse

import requests

from simulate_iot import API


def main():
    ap = argparse.ArgumentParser(description="Inspect readings, verdicts, alerts")
    ap.add_argument("--email", required=True)
    ap.add_argument("--password", required=True)
    ap.add_argument("--base-url", default="http://localhost:4000")
    ap.add_argument("--days", type=float, default=2)
    ap.add_argument("--fever", default=None, help="tag to inject a 40.5C reading for")
    args = ap.parse_args()

    api = API(args.base_url)
    api.login(args.email, args.password)
    cows = api.get("/cattle", {"limit": 100})["data"]
    print(f"{len(cows)} cattle:\n")

    for c in sorted(cows, key=lambda x: x.get("tagNumber", "")):
        tag = c["tagNumber"]
        rs = api.get("/thermaguard/readings", {"cattleId": c["id"], "days": args.days, "limit": 100})["data"]
        temps = [r["temperatureC"] for r in rs]
        preds = api.get("/thermaguard/predictions", {"cattleId": c["id"], "limit": 3})["data"]
        latest = preds[0] if preds else None
        print(f"  {tag}: {len(rs)} readings, "
              f"max {max(temps) if temps else '-'}C, "
              f"latest ML: {latest['label'] + ' ' + str(latest['anomalyScore']) if latest else 'pending ML'}")

    alerts = api.get("/alerts", {"type": "HEALTH", "limit": 100})["data"]
    print(f"\n{len(alerts)} HEALTH alerts (newest first):")
    for a in alerts[:10]:
        print(f"  [{a['severity']}] {a['title']} — read={a['isRead']} — {a['createdAt']}")

    if args.fever:
        match = [c for c in cows if c["tagNumber"] == args.fever]
        if not match:
            print(f"\nNo cow with tag {args.fever}")
            return
        res = api.send_reading({"cattleId": match[0]["id"], "temperatureC": 40.5})
        print(f"\nInjected 40.5C for {args.fever}: anomaly={res.get('anomaly')} "
              f"risk={res.get('riskLevel')} scoredBy={res.get('scoredBy')} alertCreated={res.get('alertCreated')}")
        print("Check the inbox — a CRITICAL email should follow within seconds.")


if __name__ == "__main__":
    main()
