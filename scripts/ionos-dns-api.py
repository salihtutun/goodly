#!/usr/bin/env python3
"""Update searchgoodly.com DNS via IONOS Hosting API."""
import json
import os
import sys
import urllib.request

BASE = "https://api.hosting.ionos.com/dns/v1"
DOMAIN = "searchgoodly.com"

DELETE_RULES = [
    ("A", "@", "74.208.236.105"),
    ("A", "searchgoodly.com", "74.208.236.105"),
    ("AAAA", "@", None),
    ("AAAA", "searchgoodly.com", None),
    ("TXT", None, "depws_mutex"),
    ("CNAME", "_domainconnect", None),
    ("CNAME", "autodiscover", None),
]

ADD_RECORDS = [
    {"name": "@", "type": "A", "content": "76.76.21.21", "ttl": 3600, "disabled": False},
    {"name": "www", "type": "CNAME", "content": "cname.vercel-dns.com", "ttl": 3600, "disabled": False},
    {"name": "api", "type": "CNAME", "content": "ghs.googlehosted.com", "ttl": 3600, "disabled": False},
    {"name": "resend._domainkey", "type": "TXT", "content": "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD4N0Bgi7mmlkqFot3jczsfeIVJSexqOW0g1DLU/FaxVEEGg2U0UHO41VJVbVG5xemHfuoAFG8j2LquLsXMLSr7E2LJ7NXt9pVWsAgNve2Ct05yH6YZwFyI+Ctz31izSQiOcQ6tNaAV6zuiRJvVs8K+8SvqMwGZWdK24wEuiMaJnwIDAQAB", "ttl": 3600, "disabled": False},
    {"name": "send", "type": "MX", "content": "feedback-smtp.us-east-1.amazonses.com", "prio": 10, "ttl": 3600, "disabled": False},
    {"name": "send", "type": "TXT", "content": "v=spf1 include:amazonses.com ~all", "ttl": 3600, "disabled": False},
]


def api(method, path, body=None):
    key = os.environ.get("IONOS_API_KEY") or ""
    if not key:
        # Try GCP Secret Manager
        try:
            import subprocess
            key = subprocess.check_output(
                ["gcloud", "secrets", "versions", "access", "latest",
                 "--secret=IONOS_API_KEY", "--project=kai-app-1762224583"],
                text=True, stderr=subprocess.DEVNULL,
            ).strip()
        except Exception:
            pass
    if not key:
        print("ERROR: Set IONOS_API_KEY or store in GCP secret IONOS_API_KEY")
        sys.exit(1)

    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode() if body else None,
        method=method,
        headers={"X-API-Key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            return json.loads(resp.read().decode())
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:500]}")
        sys.exit(1)


def main():
    zones = api("GET", "/zones")
    zone = next((z for z in zones if z.get("name") == DOMAIN), None)
    if not zone:
        print(f"Zone {DOMAIN} not found")
        sys.exit(1)
    zone_id = zone["id"]
    print(f"Zone: {zone_id}")

    full = api("GET", f"/zones/{zone_id}")
    records = full.get("records", [])
    print(f"Records: {len(records)}")

    for r in records:
        t, n, c = r["type"], r.get("name", ""), r.get("content", "")
        delete = False
        for dt, dn, dc in DELETE_RULES:
            if t != dt:
                continue
            if dn and n not in (dn, f"{dn}.{DOMAIN}", DOMAIN if dn == "@" else dn):
                continue
            if dc and dc not in c:
                continue
            delete = True
            break
        if delete:
            print(f"DELETE {t} {n} {c[:40]}")
            api("DELETE", f"/zones/{zone_id}/records/{r['id']}")

    for rec in ADD_RECORDS:
        print(f"ADD {rec['type']} {rec['name']} -> {rec['content'][:50]}")
        api("POST", f"/zones/{zone_id}/records", rec)

    print("Done. Verify:")
    print("  dig +short searchgoodly.com A")
    print("  dig +short www.searchgoodly.com CNAME")
    print("  dig +short api.searchgoodly.com CNAME")


if __name__ == "__main__":
    main()
