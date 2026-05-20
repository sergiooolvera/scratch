import asyncio
import logging
from typing import Dict, Any, List, Optional
from engine import OddsEngine
from caliente_scraper import CalienteScraper

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("MatchSimulator")

class MatchSimulator:
    def __init__(self, db_service=None, speed_factor: float = 2.0):
        """
        - db_service: Firebase Firestore service helper (if configured).
        - speed_factor: How many seconds of real-world time equals 1 minute of match time.
        """
        self.db_service = db_service
        self.speed_factor = speed_factor
        self.engine = OddsEngine(min_edge=0.05)
        self.odds_calculator = CalienteScraper()
        self.active_simulations: Dict[str, asyncio.Task] = {}
        self.local_matches: Dict[str, Dict[str, Any]] = {}
        self.local_alerts: List[Dict[str, Any]] = []

    async def start_match_simulation(self, match_id: str, scenario: str = "corner_drought"):
        """Starts a background task to simulate a match minute-by-minute."""
        if match_id in self.active_simulations:
            logger.warning(f"Simulation for match {match_id} is already running.")
            return
            
        task = asyncio.create_task(self._run_simulation_loop(match_id, scenario))
        self.active_simulations[match_id] = task
        logger.info(f"Started simulation for match {match_id} under scenario: {scenario}")

    async def stop_match_simulation(self, match_id: str):
        """Stops an active match simulation."""
        if match_id in self.active_simulations:
            self.active_simulations[match_id].cancel()
            del self.active_simulations[match_id]
            if match_id in self.local_matches:
                del self.local_matches[match_id]
            logger.info(f"Stopped simulation for match {match_id}")

    async def _run_simulation_loop(self, match_id: str, scenario: str):
        """The main simulation loop running minute-by-minute."""
        # Initialize match state
        home_team, away_team = "Pumas UNAM", "Guadalajara"
        if scenario == "late_storm":
            home_team, away_team = "Monterrey", "Tigres"
        elif scenario == "red_card_test":
            home_team, away_team = "America", "Cruz Azul"

        minute = 1
        score_home = 0
        score_away = 0
        corners_total = 0
        yellow_cards_total = 0
        red_cards_total = 0
        red_cards_home = 0
        red_cards_away = 0
        dangerous_attacks_home = 0
        dangerous_attacks_away = 0
        
        try:
            while minute <= 90:
                # Scenario-based statistical progression
                if scenario == "corner_drought":
                    # Severe corner drought from minute 1 to 35, followed by a late storm
                    if minute < 35:
                        # Only 1 corner total up to min 35
                        corners_total = 1 if minute >= 12 else 0
                    else:
                        # Severe corner storm starting at minute 35!
                        # Add a corner every 7-8 minutes
                        corners_total = 1 + int((minute - 35) / 7)
                        
                    # Slow, steady yellow cards
                    yellow_cards_total = int(minute / 25)
                    
                    # Normal attack progression
                    dangerous_attacks_home = int(minute * 0.7)
                    dangerous_attacks_away = int(minute * 0.6)
                    
                    # No goals yet
                    score_home, score_away = 0, 0

                elif scenario == "late_storm":
                    # Scenario 2: Severe offensive pressure from Monterrey, leading to a late goal
                    dangerous_attacks_home = int(minute * 1.5) # Heavy home storm!
                    dangerous_attacks_away = int(minute * 0.5)
                    
                    # Normal corners
                    corners_total = int(minute / 10)
                    yellow_cards_total = int(minute / 20)
                    
                    # Goal scored at minute 68!
                    if minute >= 68:
                        score_home = 1
                    else:
                        score_home = 0

                elif scenario == "red_card_test":
                    # Scenario 3: Red card for the away team at minute 18
                    dangerous_attacks_home = int(minute * 1.1)
                    dangerous_attacks_away = int(minute * 0.5)
                    corners_total = int(minute / 9)
                    yellow_cards_total = int(minute / 15)
                    
                    # Red card for away team starting at minute 18
                    if minute >= 18:
                        red_cards_total = 1
                        red_cards_away = 1
                    else:
                        red_cards_total = 0
                        red_cards_away = 0
                    
                    score_home = 0
                    score_away = 0

                # Formulate Flashscore live stats structure
                live_stats = {
                    "corners_total": corners_total,
                    "yellow_cards_total": yellow_cards_total,
                    "red_cards_home": red_cards_home,
                    "red_cards_away": red_cards_away,
                    "red_cards_total": red_cards_total,
                    "dangerous_attacks_home": dangerous_attacks_home,
                    "dangerous_attacks_away": dangerous_attacks_away
                }

                # Calculate Caliente live lines & odds dynamically using our calculator
                match_info_summary = {
                    "minute": minute,
                    "score_home": score_home,
                    "score_away": score_away
                }
                odds_detail = self.odds_calculator._simulate_realistic_odds(match_info_summary)

                match_state = {
                    "id": match_id,
                    "home_team": home_team,
                    "away_team": away_team,
                    "minute": minute,
                    "score_home": score_home,
                    "score_away": score_away,
                    "live_stats": live_stats,
                    "odds_ml": {"1": 2.10, "X": 3.10, "2": 2.90},
                    "odds_detail": odds_detail,
                    "is_simulated": True
                }

                # Update Local Memory State
                self.local_matches[match_id] = match_state

                # Push to Firebase Firestore (if database service is available)
                if self.db_service:
                    await self.db_service.update_live_match(match_id, match_state)

                # Run Mathematical Evaluation Engine to detect opportunities
                alerts = self.engine.evaluate_match_opportunities(match_state, live_stats)
                
                for alert in alerts:
                    # Enrich alert with match metadata
                    alert["match_id"] = match_id
                    alert["home_team"] = home_team
                    alert["away_team"] = away_team
                    alert["minute"] = minute
                    alert["score"] = f"{score_home}-{score_away}"
                    
                    # Avoid duplicates in local list
                    if not any(a["market"] == alert["market"] and a["match_id"] == match_id for a in self.local_alerts):
                        logger.info(f"🚨 OPPORTUNITY DETECTED! Pushing alert: {alert['title']} @ Min {minute}")
                        self.local_alerts.insert(0, alert)
                        
                        # Push Alert to Firebase Firestore and send FCM Notification
                        if self.db_service:
                            await self.db_service.push_live_alert(alert)

                logger.info(f"[SIMULATOR - {scenario}] Match {home_team} {score_home}-{score_away} {away_team} | Min {minute}' | Corners: {corners_total} | DA: {dangerous_attacks_home}-{dangerous_attacks_away}")
                
                # Advance minute
                minute += 1
                await asyncio.sleep(self.speed_factor)
                
            logger.info(f"Simulation completed for match {match_id}.")
            del self.active_simulations[match_id]
            
        except asyncio.CancelledError:
            logger.info(f"Simulation canceled for match {match_id}.")
        except Exception as e:
            logger.error(f"Error in simulation loop for match {match_id}: {e}")
