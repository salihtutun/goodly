#!/usr/bin/env python3
"""Add Resend DNS records for searchgoodly.com via IONOS Hosting API."""
import json, os, sys, urllib.request, urllib.error
BASE = "https://api.hosting.ionos.com/dns/v1"
DOMAIN = "searchgoodly.com"
RECORDS = [
    {"name": "resend._domainkey", "type": "TXT",
     "content": "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD4N0Bgi7mmlkqFot3jczsfeIVJSexqOW0g1DLU/FaxVEEGg2U0UHO41VJVbVG5xemHfuoAFG8j2LquLsXMLSr7E2LJ7NXt9pVWsAgNve2Ct05yH6YZwFyI+Ctz31izSQiOcQ6tNaAV6zuiRJvVs8K+8SvqMwGZWdK24wEuiMaJnwIDAQAB",
     "ttl": 3600, "disabled": False},
    {"name": "send", "type": "MX", "content": "feedback-smtp.us-east-1.amazonses.com",
     "prio": 10, "ttl": 3600, "disabled": False},
    {"name": "send", "type": "TXT", "content": "v=spf1 include:amazonses.com ~all",
     "ttl": 3600, "disabled": False},
]

def api(method, path, body=None):
    key = os.environ.get("IONOS_API_KEY", "").strip()
    if not key:
        print("Set IONOS_API_KEY=public.private from https://my.ionos.com/account-api")
        sys.exit(1)
    req = urllib.request.Request(
        f"{BASE}{path}", data=json.dumps(body).encode() if body else None,
        method=method, headers={"X-API-Key": key, "Content-Type": "application/json"})
    with urllib.request.urlopen(req, timeout=30) as resp:
        raw = resp.read().decode()
        return json.loads(raw) if raw else {}

def main():
    zones = api("GET", "/zones")
    zone = next(z for z in zones if z.get("name") == DOMAIN)
    zid = zone["id"]
    full = api("GET", f"/zones/{zid}")
    existing = {(r["type"], r.get("name",""), r.get("content","")) for r in full.get("records", [])}
    for rec in RECORDS:
        key = (rec["type"], rec["name"], rec["content"])
        # also match short host forms
        if any(r[0]==rec["type"] and rec["name"] in r[1] for r in existing):
            print(f"SKIP existing {rec['type']} {rec['name']}")
            continue
        print(f"ADD {rec['type']} {rec['name']}")
        api("POST", f"/zones/{zid}/records", rec)
    print("Done. Wait ~5 min then: curl -X POST https://api.resend.com/domains/<id>/verify")

if __name__ == "__main__":
    main()
