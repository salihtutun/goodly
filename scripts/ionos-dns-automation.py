#!/usr/bin/env python3
"""Automate IONOS DNS updates for searchgoodly.com via browser."""
import asyncio
import sys
from playwright.async_api import async_playwright

DNS_URL = "https://my.ionos.com/domain-dns-settings/searchgoodly.com"
CHROME_PROFILE = "/Users/salihtutun/Library/Application Support/Google/Chrome"

RECORDS_TO_ADD = [
    ("A", "@", "76.76.21.21"),
    ("CNAME", "www", "cname.vercel-dns.com"),
    ("CNAME", "api", "ghs.googlehosted.com"),
    ("TXT", "resend._domainkey", "p=MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQD4N0Bgi7mmlkqFot3jczsfeIVJSexqOW0g1DLU/FaxVEEGg2U0UHO41VJVbVG5xemHfuoAFG8j2LquLsXMLSr7E2LJ7NXt9pVWsAgNve2Ct05yH6YZwFyI+Ctz31izSQiOcQ6tNaAV6zuiRJvVs8K+8SvqMwGZWdK24wEuiMaJnwIDAQAB"),
    ("MX", "send", "feedback-smtp.us-east-1.amazonses.com", "10"),
    ("TXT", "send", "v=spf1 include:amazonses.com ~all"),
]

async def main():
    async with async_playwright() as p:
        # Try Chrome profile for existing IONOS session
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir=CHROME_PROFILE,
                channel="chrome",
                headless=False,
                args=["--profile-directory=Default"],
            )
        except Exception as e:
            print(f"Chrome profile launch failed: {e}")
            browser = await p.chromium.launch(channel="chrome", headless=False)
            context = await browser.new_context()

        page = context.pages[0] if context.pages else await context.new_page()
        print(f"Navigating to {DNS_URL}")
        await page.goto(DNS_URL, wait_until="networkidle", timeout=60000)

        title = await page.title()
        url = page.url
        print(f"Page: {title} | {url}")

        if "login" in url.lower() or "sign" in url.lower():
            print("LOGIN_REQUIRED: Not logged into IONOS. Log in in the browser window, then re-run.")
            await page.wait_for_timeout(120000)  # 2 min for manual login
            await page.goto(DNS_URL, wait_until="networkidle", timeout=60000)
            url = page.url
            if "login" in url.lower():
                print("FAILED: Still on login page")
                await context.close()
                sys.exit(1)

        # Screenshot for debugging
        await page.screenshot(path="/tmp/ionos-dns-page.png", full_page=True)
        print("Screenshot saved: /tmp/ionos-dns-page.png")

        content = await page.content()
        if "74.208.236.105" in content:
            print("Found old A record 74.208.236.105 in page")
        if "76.76.21.21" in content:
            print("Already has Vercel A record 76.76.21.21")

        # Try IONOS "Add record" button patterns
        add_btn = page.locator("button:has-text('Add record'), button:has-text('Add'), a:has-text('Add record')").first
        if await add_btn.count() > 0:
            print("Found Add record button — attempting DNS updates...")
            for rec in RECORDS_TO_ADD:
                rtype, host, value = rec[0], rec[1], rec[2]
                prio = rec[3] if len(rec) > 3 else None
                print(f"  Adding {rtype} {host} -> {value}")
                try:
                    await add_btn.click()
                    await page.wait_for_timeout(1500)
                    # Generic IONOS form selectors
                    selects = page.locator("select")
                    if await selects.count() > 0:
                        await selects.first.select_option(label=rtype)
                    host_input = page.locator("input[name*='host'], input[placeholder*='Host'], input[aria-label*='Host']").first
                    if await host_input.count() > 0:
                        await host_input.fill(host if host != "@" else "")
                    value_input = page.locator("input[name*='points'], input[name*='value'], input[placeholder*='Points']").first
                    if await value_input.count() > 0:
                        await value_input.fill(value)
                    if prio:
                        prio_input = page.locator("input[name*='prio'], input[name*='priority']").first
                        if await prio_input.count() > 0:
                            await prio_input.fill(prio)
                    save = page.locator("button:has-text('Save'), button:has-text('Add')").last
                    await save.click()
                    await page.wait_for_timeout(2000)
                except Exception as ex:
                    print(f"    Warning: {ex}")

        await page.screenshot(path="/tmp/ionos-dns-after.png", full_page=True)
        print("Done. Check /tmp/ionos-dns-after.png")
        await context.close()

if __name__ == "__main__":
    asyncio.run(main())
