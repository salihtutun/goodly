#!/usr/bin/env python3
"""Fix api.searchgoodly.com DNS: delete Vercel A record, add Cloud Run CNAME.

Opens IONOS DNS settings in Chrome. If login is required, wait for the user.
"""
import asyncio
import sys

from playwright.async_api import async_playwright

DNS_URL = "https://my.ionos.com/domain-dns-settings/searchgoodly.com"
CHROME_PROFILE = "/Users/salihtutun/Library/Application Support/Google/Chrome"
TARGET_CNAME = "ghs.googlehosted.com"


async def main():
    async with async_playwright() as p:
        try:
            context = await p.chromium.launch_persistent_context(
                user_data_dir="/tmp/ionos-chrome-profile",
                channel="chrome",
                headless=False,
                args=["--disable-blink-features=AutomationControlled"],
            )
        except Exception as e:
            print(f"Launch failed: {e}")
            browser = await p.chromium.launch(channel="chrome", headless=False)
            context = await browser.new_context()

        page = context.pages[0] if context.pages else await context.new_page()
        print(f"Opening {DNS_URL}")
        await page.goto(DNS_URL, wait_until="domcontentloaded", timeout=90000)
        await page.wait_for_timeout(3000)

        url = page.url
        print(f"URL: {url}")
        await page.screenshot(path="/tmp/ionos-dns-start.png", full_page=True)

        if "login" in url.lower() or "signin" in url.lower() or "identifier" in url.lower():
            print("LOGIN_REQUIRED: Please log into IONOS in the browser window.")
            print("Waiting up to 3 minutes...")
            for _ in range(36):
                await page.wait_for_timeout(5000)
                url = page.url
                if "login" not in url.lower() and "signin" not in url.lower():
                    break
            if "login" in page.url.lower() or "signin" in page.url.lower():
                print("Still on login page — aborting.")
                await context.close()
                sys.exit(2)
            await page.goto(DNS_URL, wait_until="domcontentloaded", timeout=90000)
            await page.wait_for_timeout(3000)

        await page.screenshot(path="/tmp/ionos-dns-logged-in.png", full_page=True)
        content = await page.content()
        print(f"Page title: {await page.title()}")
        print(f"Has 76.76.21.21: {'76.76.21.21' in content}")
        print(f"Has ghs.googlehosted: {'ghs.googlehosted' in content}")
        print(f"Has 'api': {'api' in content.lower()}")

        # Dump visible text snippets around "api" for debugging
        text = await page.inner_text("body")
        for line in text.splitlines():
            low = line.lower()
            if "api" in low or "76.76" in low or "ghs" in low or "cname" in low:
                print(f"  LINE: {line.strip()[:120]}")

        # Try to find and delete the api A record pointing at Vercel
        deleted = False
        # Common IONOS patterns: row with host "api" and value 76.76.21.21
        rows = page.locator("tr, [class*='record'], [data-testid*='record'], li")
        count = await rows.count()
        print(f"Candidate rows: {count}")
        for i in range(min(count, 200)):
            row = rows.nth(i)
            try:
                row_text = (await row.inner_text(timeout=500)).strip()
            except Exception:
                continue
            if "76.76.21.21" in row_text and ("api" in row_text.lower() or True):
                # Prefer rows that mention api specifically
                if "api" not in row_text.lower() and "76.76.21.21" not in row_text:
                    continue
            if "76.76.21.21" in row_text:
                # Check if this is the api host (not apex @)
                if "api" in row_text.lower() or (
                    "76.76.21.21" in row_text and "searchgoodly" not in row_text.lower()
                ):
                    print(f"Found candidate row: {row_text[:160]!r}")
                    # Look for delete/trash button in row
                    for sel in [
                        "button:has-text('Delete')",
                        "button[aria-label*='Delete']",
                        "button[aria-label*='delete']",
                        "button[title*='Delete']",
                        "[data-testid*='delete']",
                        "button:has(svg)",
                        "a:has-text('Delete')",
                    ]:
                        btn = row.locator(sel)
                        if await btn.count() > 0:
                            try:
                                await btn.first.click(timeout=2000)
                                await page.wait_for_timeout(1000)
                                # Confirm dialog
                                confirm = page.locator(
                                    "button:has-text('Delete'), button:has-text('Confirm'), button:has-text('Yes')"
                                )
                                if await confirm.count() > 0:
                                    await confirm.last.click()
                                deleted = True
                                print(f"  Clicked delete via {sel}")
                                await page.wait_for_timeout(2000)
                                break
                            except Exception as ex:
                                print(f"  delete click failed: {ex}")
                    if deleted:
                        break

        # Add CNAME if missing
        content = await page.content()
        if "ghs.googlehosted.com" in content:
            print("CNAME already present.")
        else:
            print("Adding CNAME api -> ghs.googlehosted.com ...")
            add_btn = page.locator(
                "button:has-text('Add record'), button:has-text('Add DNS'), "
                "a:has-text('Add record'), button:has-text('Add')"
            ).first
            if await add_btn.count() == 0:
                print("Could not find Add record button. Manual step required.")
                print("Please in IONOS:")
                print("  1. Delete A record: host=api, value=76.76.21.21")
                print(f"  2. Add CNAME: host=api, points to={TARGET_CNAME}")
                await page.wait_for_timeout(180000)  # leave browser open
            else:
                await add_btn.click()
                await page.wait_for_timeout(1500)
                # Select CNAME type
                for sel in ["select", "[role='listbox']", "button:has-text('A')"]:
                    el = page.locator(sel).first
                    if await el.count() > 0:
                        try:
                            tag = await el.evaluate("e => e.tagName")
                            if tag == "SELECT":
                                await el.select_option(label="CNAME")
                            else:
                                await el.click()
                                opt = page.locator("text=CNAME").first
                                if await opt.count():
                                    await opt.click()
                            break
                        except Exception as ex:
                            print(f"  type select: {ex}")

                # Fill host + value
                for host_sel in [
                    "input[name*='host' i]",
                    "input[placeholder*='Host' i]",
                    "input[aria-label*='Host' i]",
                    "input[name*='name' i]",
                ]:
                    inp = page.locator(host_sel).first
                    if await inp.count():
                        await inp.fill("api")
                        break

                for val_sel in [
                    "input[name*='points' i]",
                    "input[name*='value' i]",
                    "input[name*='target' i]",
                    "input[name*='content' i]",
                    "input[placeholder*='Points' i]",
                    "input[placeholder*='Value' i]",
                ]:
                    inp = page.locator(val_sel).first
                    if await inp.count():
                        await inp.fill(TARGET_CNAME)
                        break

                save = page.locator(
                    "button:has-text('Save'), button:has-text('Add record'), button:has-text('Create')"
                ).last
                if await save.count():
                    await save.click()
                    await page.wait_for_timeout(2500)
                    print("Save clicked.")

        await page.screenshot(path="/tmp/ionos-dns-after.png", full_page=True)
        print("Screenshots: /tmp/ionos-dns-start.png /tmp/ionos-dns-logged-in.png /tmp/ionos-dns-after.png")
        print("Leaving browser open 60s for verification...")
        await page.wait_for_timeout(60000)
        await context.close()


if __name__ == "__main__":
    asyncio.run(main())
