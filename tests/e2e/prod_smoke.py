#!/usr/bin/env python3
"""Post-deploy browser smoke test against production.

Run by the CD pipeline after each Cloud Run deploy. Catches the class of
integration bugs unit tests can't see — cross-origin cookies, CSRF headers,
console errors, broken login — all of which have shipped before
(e.g. the csrf_token host-only cookie bug that 403'd every browser POST).

Requires: playwright + chromium, DEMO_PASSWORD env var.
Exits non-zero on any failure.
"""
import asyncio
import os
import sys

from playwright.async_api import async_playwright

FRONTEND = "https://searchgoodly.com"
API = "https://api.searchgoodly.com/api"
DEMO_EMAIL = "demo@smallbiz.com"

failures: list[str] = []


def check(name: str, ok: bool, detail: str = ""):
    print(f"{'PASS' if ok else 'FAIL'}: {name}" + (f" — {detail}" if detail else ""))
    if not ok:
        failures.append(name)


async def main():
    demo_password = os.environ.get("DEMO_PASSWORD", "")
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        ctx = await browser.new_context()
        page = await ctx.new_page()
        console_errors = []
        page.on(
            "console",
            lambda m: console_errors.append(m.text[:120]) if m.type == "error" else None,
        )

        # 1. Public page loads without console errors (QA #9 regression guard)
        # wait_until="load" not "networkidle" — GA/Sentry beacons can keep the
        # network busy forever and time the whole run out (seen 2026-07-22).
        # The 3s settle gives React time to mount and log any errors.
        await page.goto(f"{FRONTEND}/audit", wait_until="load", timeout=45000)
        await page.wait_for_timeout(3000)
        check("public page loads clean", not console_errors, "; ".join(console_errors[:3]))

        # 2. Prerendered meta shells serve unique titles (QA #10 regression guard)
        resp = await ctx.request.get(f"{FRONTEND}/pricing")
        body = await resp.text()
        check("prerendered meta on /pricing", "Pricing —" in body)

        # 3. Login through the real UI
        if not demo_password:
            check("login (skipped — DEMO_PASSWORD not set)", True)
        else:
            await page.goto(f"{FRONTEND}/login", wait_until="networkidle")
            await page.fill('input[type="email"]', DEMO_EMAIL)
            await page.fill('input[type="password"]', demo_password)
            await page.locator('button[type="submit"]').first.click()
            try:
                await page.wait_for_url(lambda u: "/app" in u, timeout=20000)
                check("UI login", True)
            except Exception:
                check("UI login", False, f"stuck at {page.url}")

            # 4. Authenticated browser POST — exercises CSRF cookie + header
            #    end-to-end across the api. subdomain (the bug class that
            #    shipped silently before).
            result = await page.evaluate(
                """async (api) => {
                    const m = document.cookie.match(/(?:^|;\\s*)csrf_token=([^;]*)/);
                    const r = await fetch(api + '/audits', {
                        method: 'POST', credentials: 'include',
                        headers: {'Content-Type': 'application/json',
                                  'X-CSRF-Token': m ? m[1] : ''},
                        body: JSON.stringify({url: 'https://example.com'})
                    });
                    return r.status;
                }""",
                API,
            )
            check("authenticated browser POST (CSRF)", result == 200, f"HTTP {result}")

        await browser.close()

    if failures:
        print(f"\nSMOKE FAILED: {', '.join(failures)}")
        sys.exit(1)
    print("\nAll smoke checks passed")


asyncio.run(main())
