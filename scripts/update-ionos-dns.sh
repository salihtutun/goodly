#!/bin/bash
# Update searchgoodly.com DNS in IONOS via API
# Usage: IONOS_API_KEY="publicKey.privateKey" ./scripts/update-ionos-dns.sh
#
# Get your API key: IONOS → Account → API → Create Key
# Docs: https://developer.hosting.ionos.com/docs/dns

set -euo pipefail

API_KEY="${IONOS_API_KEY:-}"
BASE="https://api.hosting.ionos.com/dns/v1"

if [ -z "$API_KEY" ]; then
  echo "Set IONOS_API_KEY=publicKey.privateKey (from IONOS API settings)"
  exit 1
fi

auth() { echo "X-API-Key: $API_KEY"; }

echo "==> Finding zone for searchgoodly.com"
ZONE_ID=$(curl -s "$BASE/zones" -H "$(auth)" | python3 -c "
import sys, json
zones = json.load(sys.stdin)
for z in zones:
    if z.get('name') == 'searchgoodly.com':
        print(z['id'])
        break
else:
    print('NOT_FOUND', file=sys.stderr)
    sys.exit(1)
")
echo "Zone ID: $ZONE_ID"

echo "==> Current records"
curl -s "$BASE/zones/$ZONE_ID" -H "$(auth)" | python3 -c "
import sys, json
z = json.load(sys.stdin)
for r in z.get('records', []):
    print(f\"{r['id']:40} {r['type']:6} {r['name']:20} {r.get('content','')[:60]}\")
" | tee /tmp/ionos-records-before.txt

delete_record() {
  local id="$1"
  echo "  DELETE $id"
  curl -s -X DELETE "$BASE/zones/$ZONE_ID/records/$id" -H "$(auth)" -o /dev/null -w "%{http_code}\n"
}

upsert_record() {
  local name="$1" type="$2" content="$3" prio="${4:-}"
  local payload
  if [ -n "$prio" ]; then
    payload="{\"name\":\"$name\",\"type\":\"$type\",\"content\":\"$content\",\"prio\":$prio,\"ttl\":3600,\"disabled\":false}"
  else
    payload="{\"name\":\"$name\",\"type\":\"$type\",\"content\":\"$content\",\"ttl\":3600,\"disabled\":false}"
  fi
  echo "  ADD/UPDATE $type $name -> $content"
  curl -s -X POST "$BASE/zones/$ZONE_ID/records" \
    -H "$(auth)" -H "Content-Type: application/json" \
    -d "$payload" | python3 -c "import sys,json; d=json.load(sys.stdin); print('   ', d.get('id',''), d.get('type',''), d.get('name',''))"
}

echo "==> Deleting old hosting records"
curl -s "$BASE/zones/$ZONE_ID" -H "$(auth)" | python3 -c "
import sys, json
z = json.load(sys.stdin)
for r in z.get('records', []):
    t, n, c = r['type'], r['name'], r.get('content','')
    if t == 'A' and n in ('@', 'searchgoodly.com') and c == '74.208.236.105':
        print(r['id'])
    elif t == 'AAAA' and n in ('@', 'searchgoodly.com'):
        print(r['id'])
    elif t == 'TXT' and 'depws_mutex' in c:
        print(r['id'])
    elif t == 'CNAME' and n in ('_domainconnect', '_domainconnect.searchgoodly.com'):
        print(r['id'])
    elif t == 'CNAME' and n in ('autodiscover', 'autodiscover.searchgoodly.com'):
        print(r['id'])
" | while read -r rid; do
  [ -n "$rid" ] && delete_record "$rid"
done

echo "==> Adding Vercel + Cloud Run records"
upsert_record "@" A "76.76.21.21"
upsert_record "www" CNAME "cname.vercel-dns.com"
upsert_record "api" CNAME "ghs.googlehosted.com"

echo "==> Adding Resend email records (hello@searchgoodly.com)"
upsert_record "resend._domainkey" TXT "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD4N0Bgi7mmlkqFot3jczsfeIVJSexqOW0g1DLU/FaxVEEGg2U0UHO41VJVbVG5xemHfuoAFG8j2LquLsXMLSr7E2LJ7NXt9pVWsAgNve2Ct05yH6YZwFyI+Ctz31izSQiOcQ6tNaAV6zuiRJvVs8K+8SvqMwGZWdK24wEuiMaJnwIDAQAB"
upsert_record "send" MX "feedback-smtp.us-east-1.amazonses.com" 10
upsert_record "send" TXT "v=spf1 include:amazonses.com ~all"

echo "==> Done. Verify with:"
echo "  dig +short searchgoodly.com A"
echo "  dig +short www.searchgoodly.com CNAME"
echo "  dig +short api.searchgoodly.com CNAME"
