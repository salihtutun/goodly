#!/usr/bin/env python3
"""Replace api.searchgoodly.com A→Vercel with CNAME→ghs.googlehosted.com via IONOS API.

Usage:
  IONOS_API_KEY='public.private' python3 scripts/fix-api-cname-ionos.py
"""
import json
import os
import sys
import urllib.error
import urllib.request

BASE = "https://api.hosting.ionos.com/dns/v1"
DOMAIN = "searchgoodly.com"
TARGET = "ghs.googlehosted.com"


def get_key():
    key = os.environ.get("IONOS_API_KEY", "").strip()
    if key:
        return key
    try:
        import subprocess

        return subprocess.check_output(
            [
                "gcloud",
                "secrets",
                "versions",
                "access",
                "latest",
                "--secret=IONOS_API_KEY",
                "--project=kai-app-1762224583",
            ],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return ""


def api(method, path, body=None):
    key = get_key()
    if not key:
        print("ERROR: Set IONOS_API_KEY=publicKey.privateKey")
        print("Create one at: https://my.ionos.com/account-api")
        sys.exit(1)
    req = urllib.request.Request(
        f"{BASE}{path}",
        data=json.dumps(body).encode() if body is not None else None,
        method=method,
        headers={"X-API-Key": key, "Content-Type": "application/json"},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        print(f"HTTP {e.code}: {e.read().decode()[:500]}")
        sys.exit(1)


def host_matches(name: str) -> bool:
    n = (name or "").lower().rstrip(".")
    return n in ("api", f"api.{DOMAIN}", f"api.{DOMAIN}.")


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
    api_records = [r for r in records if host_matches(r.get("name", ""))]
    print(f"Existing api records ({len(api_records)}):")
    for r in api_records:
        print(f"  {r['id']} {r['type']} {r.get('name')} -> {r.get('content')}")

    # Delete any non-CNAME api records, and wrong CNAMEs
    keep_cname = False
    for r in api_records:
        content = (r.get("content") or "").rstrip(".")
        if r["type"] == "CNAME" and content.lower() == TARGET.lower():
            keep_cname = True
            print(f"KEEP correct CNAME {r['id']}")
            continue
        print(f"DELETE {r['type']} {r.get('name')} -> {r.get('content')}")
        api("DELETE", f"/zones/{zone_id}/records/{r['id']}")

    if not keep_cname:
        body = {
            "name": "api",
            "type": "CNAME",
            "content": TARGET,
            "ttl": 3600,
            "disabled": False,
        }
        print(f"ADD CNAME api -> {TARGET}")
        created = api("POST", f"/zones/{zone_id}/records", body)
        print("Created:", created.get("id"), created.get("type"), created.get("content"))

    print("Done. Verify with: dig +short api.searchgoodly.com CNAME")


if __name__ == "__main__":
    main()
