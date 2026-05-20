import asyncio
import logging
from playwright.async_api import async_playwright

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TestRows")

async def test_rows():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        context = await browser.new_context(
            user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        )
        page = await context.new_page()
        
        logger.info("Navigating to Flashscore...")
        await page.goto("https://www.flashscore.com.mx", timeout=30000, wait_until="domcontentloaded")
        await asyncio.sleep(5) # Wait for complete dynamic load
        
        # Click on 'EN VIVO' tab
        live_tab = page.locator("text=EN VIVO")
        if await live_tab.count() > 0:
            logger.info("Clicking on 'EN VIVO' tab...")
            await live_tab.first.click()
            await asyncio.sleep(4)
            
        rows = await page.query_selector_all("[id^='g_1_']")
        logger.info(f"Found {len(rows)} match rows.")
        
        if rows:
            first_row = rows[0]
            id_attr = await first_row.get_attribute("id")
            html = await first_row.evaluate("el => el.outerHTML")
            logger.info(f"First Row ID: {id_attr}")
            logger.info(f"HTML of First Row:\n{html[:4000]}\n...")
            
        await browser.close()

if __name__ == "__main__":
    asyncio.run(test_rows())
