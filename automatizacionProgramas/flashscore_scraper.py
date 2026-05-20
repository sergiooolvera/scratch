import asyncio
import logging
from typing import List, Dict, Any, Optional
from playwright.async_api import async_playwright, Page, BrowserContext

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FlashscoreScraper")

class FlashscoreScraper:
    def __init__(self, headless: bool = True):
        self.headless = headless
        self.base_url = "https://www.flashscore.com.mx"
        self._pw = None
        self._browser = None
        self._context: Optional[BrowserContext] = None

    async def start(self):
        """Starts the Playwright browser session."""
        if not self._browser:
            logger.info("Starting Playwright browser...")
            self._pw = await async_playwright().start()
            self._browser = await self._pw.chromium.launch(
                headless=self.headless,
                args=["--disable-gpu", "--no-sandbox", "--disable-setuid-sandbox"]
            )
            # Create a context with desktop User-Agent to bypass basic anti-bot blocks
            self._context = await self._browser.new_context(
                user_agent="Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                viewport={"width": 1280, "height": 800}
            )

    async def close(self):
        """Closes the browser session."""
        if self._browser:
            logger.info("Closing Playwright browser...")
            await self._browser.close()
            self._browser = None
        if self._pw:
            await self._pw.stop()
            self._pw = None

    async def get_live_matches(self) -> List[Dict[str, Any]]:
        """
        Navigates to the live matches section and extracts:
        - Match ID (Flashscore ID)
        - Home Team, Away Team
        - Current Score (Home & Away)
        - Current Match Minute / Stage
        """
        await self.start()
        page = await self._context.new_page()
        try:
            logger.info(f"Navigating to {self.base_url} to fetch live matches...")
            await page.goto(self.base_url, timeout=30000, wait_until="domcontentloaded")
            
            # Click on "EN VIVO" tab if it exists to filter live matches
            # The selector is usually .filters__group or we can filter elements containing "EN VIVO"
            live_tab = page.locator("text=EN VIVO")
            if await live_tab.count() > 0:
                logger.info("Clicking on 'EN VIVO' tab...")
                await live_tab.first.click()
                await asyncio.sleep(2) # Allow DOM to filter

            # Locate the match rows. In Flashscore, match rows typically have an ID of 'g_1_XXXXXXXX'
            # inside containers with classes like '.sportName' or '.soccer'
            logger.info("Parsing live match rows...")
            try:
                await page.wait_for_selector(".event__homeParticipant, .event__participant--home", state="attached", timeout=10000)
            except Exception as e:
                logger.warning(f"Timeout waiting for live match rows: {e}. Matches may not be loaded yet.")
                
            # Perform a single high-speed JS evaluation to extract all live match data in 5-10ms
            raw_matches = await page.evaluate("""() => {
                const rows = document.querySelectorAll("[id^='g_1_']");
                const results = [];
                
                rows.forEach(element => {
                    const id_attr = element.getAttribute("id") || "";
                    const match_id = id_attr.replace("g_1_", "");
                    if (!match_id) return;
                    
                    // Home and Away team elements
                    const home_el = element.querySelector(".event__participant--home, .event__homeParticipant");
                    const away_el = element.querySelector(".event__participant--away, .event__awayParticipant");
                    
                    if (!home_el || !away_el) return;
                    
                    // Extract text content carefully
                    let home_team = "Unknown";
                    const home_name_el = home_el.querySelector("[class*='name']");
                    home_team = home_name_el ? home_name_el.textContent : home_el.textContent;
                    
                    let away_team = "Unknown";
                    const away_name_el = away_el.querySelector("[class*='name']");
                    away_team = away_name_el ? away_name_el.textContent : away_el.textContent;
                    
                    if (!home_team || !away_team) return;
                    
                    // Extract scores
                    const score_home_el = element.querySelector(".event__score--home");
                    const score_away_el = element.querySelector(".event__score--away");
                    const score_home = score_home_el ? score_home_el.textContent : "0";
                    const score_away = score_away_el ? score_away_el.textContent : "0";
                    
                    // Extract minute/status
                    const stage_el = element.querySelector(".event__stage--live, .event__time, .event__stage--actual, .event__stage");
                    const minute_str = stage_el ? stage_el.textContent.trim() : "0'";
                    
                    // Filter out finished matches or scheduled matches that aren't live
                    const is_live = minute_str.includes("'") || minute_str.includes("Descanso") || minute_str.includes("HT") || /^\\d+$/.test(minute_str);
                    if (!is_live) return;
                    
                    // Detect red cards
                    const home_red_el = home_el.querySelector(".card-ico--red, .card-ny, [class*='redCard'], [class*='red-card'], .card-ico, [class*='card']");
                    const away_red_el = away_el.querySelector(".card-ico--red, .card-ny, [class*='redCard'], [class*='red-card'], .card-ico, [class*='card']");
                    
                    const red_cards_home = home_red_el ? 1 : 0;
                    const red_cards_away = away_red_el ? 1 : 0;
                    const red_cards_total = red_cards_home + red_cards_away;
                    
                    results.push({
                        "id": match_id,
                        "home_team": home_team.trim(),
                        "away_team": away_team.trim(),
                        "score_home": parseInt(score_home) || 0,
                        "score_away": parseInt(score_away) || 0,
                        "minute_str": minute_str,
                        "red_cards_home": red_cards_home,
                        "red_cards_away": red_cards_away,
                        "red_cards_total": red_cards_total
                    });
                });
                
                return results;
            }""")

            live_matches = []
            for rm in raw_matches:
                live_matches.append({
                    "id": rm["id"],
                    "home_team": rm["home_team"],
                    "away_team": rm["away_team"],
                    "score_home": rm["score_home"],
                    "score_away": rm["score_away"],
                    "minute_str": rm["minute_str"],
                    "minute": self._parse_minute(rm["minute_str"]),
                    "red_cards_home": rm["red_cards_home"],
                    "red_cards_away": rm["red_cards_away"],
                    "red_cards_total": rm["red_cards_total"]
                })

            logger.info(f"Found {len(live_matches)} active live soccer matches.")
            return live_matches
            
        except Exception as e:
            logger.error(f"Error fetching live matches: {e}")
            return []
        finally:
            await page.close()

    def _parse_minute(self, minute_str: str) -> int:
        """Parses minute string (e.g. 34', Descanso) into an integer representing elapsed minutes."""
        if "Descanso" in minute_str or "HT" in minute_str:
            return 45
        clean = "".join(filter(str.isdigit, minute_str))
        if clean:
            return int(clean)
        return 0

    async def get_match_live_stats(self, match_id: str) -> Dict[str, Any]:
        """
        Navigates to the specific match statistics page and parses:
        - Tiros de esquina (Corner kicks)
        - Tarjetas amarillas (Yellow cards)
        - Tarjetas rojas (Red cards)
        - Ataques peligrosos (Dangerous attacks)
        - Posesión (Possession)
        - Remates totales (Total shots)
        - Remates a puerta (Shots on target)
        - Goles esperados (Expected Goals - xG)
        """
        await self.start()
        page = await self._context.new_page()
        stats_url = f"{self.base_url}/partido/{match_id}/#/resumen-del-partido/estadisticas-del-partido/0"
        
        # Default empty stats structure
        stats = {
            "corners_home": 0, "corners_away": 0, "corners_total": 0,
            "yellow_cards_home": 0, "yellow_cards_away": 0, "yellow_cards_total": 0,
            "red_cards_home": 0, "red_cards_away": 0, "red_cards_total": 0,
            "dangerous_attacks_home": 0, "dangerous_attacks_away": 0,
            "possession_home": 50, "possession_away": 50,
            "shots_total_home": 0, "shots_total_away": 0,
            "shots_on_target_home": 0, "shots_on_target_away": 0,
            "xg_home": 0.0, "xg_away": 0.0
        }
        
        try:
            logger.info(f"Navigating to stats page for match {match_id}: {stats_url}")
            await page.goto(stats_url, timeout=30000, wait_until="domcontentloaded")
            
            # Allow a small delay for stats container to render
            await asyncio.sleep(2)
            
            # Locate statistics rows.
            # Perform resilient parsing using data-testid attributes
            stats_data = await page.evaluate("""() => {
                const stats = {
                    corners_home: 0, corners_away: 0, corners_total: 0,
                    yellow_cards_home: 0, yellow_cards_away: 0, yellow_cards_total: 0,
                    red_cards_home: 0, red_cards_away: 0, red_cards_total: 0,
                    dangerous_attacks_home: 0, dangerous_attacks_away: 0,
                    possession_home: 50, possession_away: 50,
                    shots_total_home: 0, shots_total_away: 0,
                    shots_on_target_home: 0, shots_on_target_away: 0,
                    xg_home: 0.0, xg_away: 0.0
                };
                
                const categoryEls = document.querySelectorAll('[data-testid="wcl-statistics-category"]');
                categoryEls.forEach(catEl => {
                    const parent = catEl.parentElement;
                    if (!parent) return;
                    
                    const categoryText = catEl.textContent.trim().toLowerCase();
                    const valueEls = parent.querySelectorAll('[data-testid="wcl-statistics-value"]');
                    if (valueEls.length < 2) return;
                    
                    const homeValStr = valueEls[0].textContent.trim();
                    const awayValStr = valueEls[1].textContent.trim();
                    
                    // Helper to parse ints
                    const cleanInt = (str) => parseInt(str.replace(/\\D/g, '')) || 0;
                    
                    if (categoryText.includes("tiros de esquina") || categoryText.includes("saques de esquina") || categoryText.includes("corners")) {
                        stats.corners_home = cleanInt(homeValStr);
                        stats.corners_away = cleanInt(awayValStr);
                        stats.corners_total = stats.corners_home + stats.corners_away;
                    }
                    else if (categoryText.includes("tarjetas amarillas") || categoryText.includes("yellow cards")) {
                        stats.yellow_cards_home = cleanInt(homeValStr);
                        stats.yellow_cards_away = cleanInt(awayValStr);
                        stats.yellow_cards_total = stats.yellow_cards_home + stats.yellow_cards_away;
                    }
                    else if (categoryText.includes("tarjetas rojas") || categoryText.includes("red cards")) {
                        stats.red_cards_home = cleanInt(homeValStr);
                        stats.red_cards_away = cleanInt(awayValStr);
                        stats.red_cards_total = stats.red_cards_home + stats.red_cards_away;
                    }
                    else if (categoryText.includes("ataques peligrosos") || categoryText.includes("dangerous attacks")) {
                        stats.dangerous_attacks_home = cleanInt(homeValStr);
                        stats.dangerous_attacks_away = cleanInt(awayValStr);
                    }
                    else if (categoryText.includes("posesión") || categoryText.includes("possession")) {
                        stats.possession_home = cleanInt(homeValStr);
                        stats.possession_away = cleanInt(awayValStr);
                    }
                    else if (categoryText.includes("remates a puerta") || categoryText.includes("shots on target")) {
                        stats.shots_on_target_home = cleanInt(homeValStr);
                        stats.shots_on_target_away = cleanInt(awayValStr);
                    }
                    else if (categoryText.includes("remates") || categoryText.includes("shots")) {
                        stats.shots_total_home = cleanInt(homeValStr);
                        stats.shots_total_away = cleanInt(awayValStr);
                    }
                    else if (categoryText.includes("goles esperados") || categoryText.includes("expected goals") || categoryText.includes("xg")) {
                        stats.xg_home = parseFloat(homeValStr) || 0.0;
                        stats.xg_away = parseFloat(awayValStr) || 0.0;
                    }
                });
                
                return stats;
            }""")
            
            # Merge with default empty stats structure
            for key, val in stats_data.items():
                stats[key] = val
                
            logger.info(f"Successfully parsed stats: {stats}")
            return stats
            
        except Exception as e:
            logger.error(f"Error parsing stats for match {match_id}: {e}")
            return stats
        finally:
            await page.close()

# Quick test if run directly
if __name__ == "__main__":
    async def run_test():
        scraper = FlashscoreScraper(headless=True)
        try:
            matches = await scraper.get_live_matches()
            print("LIVE MATCHES DETECTED:")
            for m in matches[:5]:
                print(f"ID: {m['id']} | {m['home_team']} {m['score_home']}-{m['score_away']} {m['away_team']} ({m['minute_str']})")
                
            if matches:
                first_match_id = matches[0]["id"]
                print(f"\nFetching stats for first match ID {first_match_id}...")
                stats = await scraper.get_match_live_stats(first_match_id)
                print("STATS OBTAINED:")
                print(stats)
        finally:
            await scraper.close()

    asyncio.run(run_test())
