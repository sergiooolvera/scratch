import asyncio
import uuid
import logging
from fastapi import FastAPI, BackgroundTasks, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, Any, List
from fastapi.responses import RedirectResponse

from firebase_service import FirebaseService
from simulator import MatchSimulator
from flashscore_scraper import FlashscoreScraper
from caliente_scraper import CalienteScraper
from engine import OddsEngine
import stripe
import os
from dotenv import load_dotenv

load_dotenv() # Load environment variables from .env file

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("SmartOddsAPI")

app = FastAPI(
    title="SmartOdds Orchestrator API",
    description="Backend API for Flashscore statistics, Caliente live odds matching, and live value bet evaluation.",
    version="1.0.0"
)

# Enable CORS for local testing from Flutter Web / mobile emulators
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Service (defensively handles missing file)
firebase_service = FirebaseService(service_account_path="firebase_service_account.json")

# Initialize Simulator (connects to firebase service if enabled)
simulator = MatchSimulator(db_service=firebase_service, speed_factor=1.5)

# Initialize Real Scrapers and Engine
flashscore_scraper = FlashscoreScraper(headless=True)
caliente_scraper = CalienteScraper(headless=True)
engine = OddsEngine(min_edge=0.05)

# Active real-game background polling loop task
real_polling_task = None
real_polling_active = False

@app.on_event("startup")
async def startup_event():
    logger.info("SmartOdds API started. Local memory mode and simulation endpoints are ready.")
    # Run dynamic Firebase database cleanup for old/finished records
    if firebase_service.enabled:
        loop = asyncio.get_event_loop()
        loop.run_in_executor(None, firebase_service.cleanup_old_data)

@app.on_event("shutdown")
async def shutdown_event():
    # Clean up active simulations
    logger.info("Shutting down API. Stopping all simulations...")
    active_ids = list(simulator.active_simulations.keys())
    for mid in active_ids:
        await simulator.stop_match_simulation(mid)
        
    global real_polling_active
    real_polling_active = False
    await flashscore_scraper.close()
    await caliente_scraper.close()

# --- SIMULATION ENDPOINTS (For easy testing) ---

@app.post("/simulation/start", tags=["Simulation"])
async def start_simulation(
    scenario: str = Query("corner_drought", description="Scenario to run: 'corner_drought' or 'late_storm'"),
    match_id: str = Query(None, description="Optional custom match ID")
):
    """
    Starts a live, minute-by-minute soccer match simulation in the background.
    It will automatically push live match states and +EV alerts to Firebase Firestore
    (if enabled) or save them in local memory.
    """
    m_id = match_id or f"sim_{str(uuid.uuid4())[:8]}"
    await simulator.start_match_simulation(m_id, scenario)
    return {
        "status": "success",
        "message": f"Simulation started under scenario '{scenario}'",
        "match_id": m_id
    }

@app.post("/simulation/stop", tags=["Simulation"])
async def stop_simulation(match_id: str):
    """Stops an active simulation and deletes its state."""
    if match_id not in simulator.active_simulations:
        raise HTTPException(status_code=404, detail="Active simulation not found for this match ID.")
        
    await simulator.stop_match_simulation(match_id)
    return {
        "status": "success",
        "message": f"Simulation stopped for match {match_id}"
    }

@app.get("/simulation/active", tags=["Simulation"])
async def get_active_simulations():
    """Lists all active match simulation tasks currently running."""
    return {
        "active_simulations": list(simulator.active_simulations.keys())
    }

# --- REAL-TIME LIVE GAMES POLLING ENDPOINTS ---

async def _real_game_polling_loop():
    """Periodic background loop that fetches real matches from Flashscore and Caliente."""
    global real_polling_active
    logger.info("Real game background polling loop STARTED.")
    
    try:
        while real_polling_active:
            logger.info("Polling Flashscore.com.mx for real-time live matches...")
            # 1. Fetch live matches from Flashscore
            live_matches = await flashscore_scraper.get_live_matches()
            
            if not live_matches:
                logger.info("No active live soccer matches on Flashscore right now.")
                await asyncio.sleep(120)
                continue
                
            # --- IMMEDIATE RED CARD ALERT DETECTION (No Caliente check needed!) ---
            for fm in live_matches:
                match_id = fm["id"]
                minute = fm["minute"]
                red_total = fm.get("red_cards_total", 0)
                
                if minute < 65 and red_total > 0:
                    red_home = fm.get("red_cards_home", 0)
                    red_away = fm.get("red_cards_away", 0)
                    
                    if red_home > 0 and red_away > 0:
                        team_text = f"¡Tarjeta roja para ambos equipos! ({red_home} local, {red_away} visitante)"
                    elif red_home > 0:
                        team_text = f"Tarjeta roja para el equipo local ({fm['home_team']})"
                    elif red_away > 0:
                        team_text = f"Tarjeta roja para el equipo visitante ({fm['away_team']})"
                    else:
                        team_text = f"¡Tarjeta roja reportada en el partido! ({red_total} total)"
                        
                    alert = {
                        "market": "RedCard",
                        "title": f"🚨 ¡TARJETA ROJA EN VIVO! ({fm['home_team']} vs {fm['away_team']})",
                        "description": f"{team_text} en el minuto {minute}. Marcador: {fm['score_home']}-{fm['score_away']}. Oportunidad para buscar mercados de hándicap o goles.",
                        "line": float(red_total),
                        "odds": 1.0,
                        "prob_real": 100.0,
                        "prob_implied": 100.0,
                        "edge": 0.0,
                        "match_id": match_id,
                        "home_team": fm["home_team"],
                        "away_team": fm["away_team"],
                        "minute": minute,
                        "score": f"{fm['score_home']}-{fm['score_away']}"
                    }
                    
                    if not any(a["market"] == "RedCard" and a["match_id"] == match_id for a in simulator.local_alerts):
                        logger.info(f"🚨 INSTANT RED CARD ALERT TRIGGERED: {alert['title']}")
                        simulator.local_alerts.insert(0, alert)
                        if firebase_service.enabled:
                            await firebase_service.push_live_alert(alert)

            # 2. Extract detailed live odds and line mappings from Caliente
            logger.info("Fetching corresponding live odds from Caliente.mx...")
            matched_events = await caliente_scraper.get_live_odds(live_matches)
            
            # Fetch alert templates from Firestore
            templates = {}
            if firebase_service.enabled:
                templates = await firebase_service.get_alert_templates()
                
            # 3. For each match, parse its full live statistics and evaluate value bets
            for event in matched_events:
                match_id = event["flashscore_id"]
                logger.info(f"Analyzing stats and odds for real game: {event['home_team']} vs {event['away_team']}")
                
                # Fetch detailed stats (corners, cards) from Flashscore
                stats = await flashscore_scraper.get_match_live_stats(match_id)
                event["live_stats"] = stats
                
                # Update local memory
                simulator.local_matches[match_id] = event
                
                # Push to Firestore
                if firebase_service.enabled:
                    await firebase_service.update_live_match(match_id, event)
                    
                # Evaluate math engine for value opportunities
                alerts = engine.evaluate_match_opportunities(event, stats, templates)
                for alert in alerts:
                    # Skip RedCard since we already handled it instantly
                    if alert["market"] == "RedCard":
                        continue
                        
                    # Enrich metadata
                    alert["match_id"] = match_id
                    alert["home_team"] = event["home_team"]
                    alert["away_team"] = event["away_team"]
                    alert["minute"] = event["minute"]
                    alert["score"] = f"{event['score_home']}-{event['score_away']}"
                    
                    if not any(a["market"] == alert["market"] and a["match_id"] == match_id for a in simulator.local_alerts):
                        logger.info(f"🚨 REAL VALUE BET ALERT FOUND: {alert['title']}")
                        simulator.local_alerts.insert(0, alert)
                        
                        if firebase_service.enabled:
                            await firebase_service.push_live_alert(alert)

            # --- RESOLVE PENDING ALERTS (Early Settlement) ---
            if firebase_service.enabled:
                logger.info("Checking for pending alerts to resolve...")
                pending_alerts = await firebase_service.get_pending_alerts()
                
                for p_alert in pending_alerts:
                    m_id = p_alert.get("match_id")
                    market = p_alert.get("market")
                    
                    # Find the match in current live matches
                    current_match = next((m for m in live_matches if m["id"] == m_id), None)
                    
                    if current_match:
                        # Case 1: HeavyPressure or Goals (we look for score change)
                        if market in ["HeavyPressure", "Goals"]:
                            curr_score = f"{current_match['score_home']}-{current_match['score_away']}"
                            alert_score = p_alert.get("score", "0-0")
                            
                            # Parse scores
                            try:
                                curr_total = sum(map(int, curr_score.split("-")))
                                alert_total = sum(map(int, alert_score.split("-")))
                                
                                if curr_total > alert_total:
                                    logger.info(f"🏆 Alert {p_alert['id']} WON! Score changed from {alert_score} to {curr_score}.")
                                    await firebase_service.update_alert_status(p_alert["id"], "won")
                            except Exception as e:
                                logger.error(f"Error parsing scores for alert resolution: {e}")
                                
                        elif market == "RedCard":
                            await firebase_service.update_alert_status(p_alert["id"], "processed")
                            
                    else:
                        # Match disappeared from live. Mark as lost for now (simple assumption).
                        if market in ["HeavyPressure", "Goals"]:
                            logger.info(f"❌ Alert {p_alert['id']} marked as LOST (Match disappeared from live).")
                            await firebase_service.update_alert_status(p_alert["id"], "lost")

            # Wait 2 minutes between polling loops to respect live requirements
            logger.info("Finished polling round. Sleeping for 120 seconds (2 minutes)...")
            await asyncio.sleep(120)
            
    except asyncio.CancelledError:
        logger.info("Real game background polling loop CANCELED.")
    except Exception as e:
        logger.error(f"Error in real game polling loop: {e}")
        real_polling_active = False

@app.post("/orchestrator/start", tags=["Real Polling"])
async def start_orchestrator(background_tasks: BackgroundTasks):
    """
    Starts the live scraper background task to fetch real matches
    from Flashscore.com.mx and match odds with Caliente.mx in real time.
    """
    global real_polling_task, real_polling_active
    if real_polling_active:
        return {"status": "success", "message": "Orchestrator is already running."}
        
    real_polling_active = True
    # Start loop as an asyncio background task
    real_polling_task = asyncio.create_task(_real_game_polling_loop())
    return {"status": "success", "message": "Orchestrator started in real-game polling mode."}

@app.post("/orchestrator/stop", tags=["Real Polling"])
async def stop_orchestrator():
    """Stops the real-game polling background scraper."""
    global real_polling_task, real_polling_active
    if not real_polling_active:
        return {"status": "success", "message": "Orchestrator was already stopped."}
        
    real_polling_active = False
    if real_polling_task:
        real_polling_task.cancel()
        real_polling_task = None
    return {"status": "success", "message": "Orchestrator stopped."}

# --- LOCAL REST API DATA ENDPOINTS (Fallback for Flutter) ---

@app.get("/live-matches", tags=["Data Output"])
async def get_live_matches():
    """
    Returns all active live matches (both simulated and real) currently stored in memory.
    Use this endpoint in the Flutter app if Firebase Firestore is not active.
    """
    return list(simulator.local_matches.values())

@app.get("/alerts", tags=["Data Output"])
async def get_live_alerts():
    """
    Returns a list of all active +EV alerts currently recorded in memory.
    Use this endpoint in the Flutter app if Firebase Firestore is not active.
    """
    return simulator.local_alerts

@app.get("/system/status", tags=["System Status"])
async def get_system_status():
    """Returns the operational status of Firebase connection and active scrapers."""
    return {
        "firebase_enabled": firebase_service.enabled,
        "simulations_active": len(simulator.active_simulations),
        "real_polling_active": real_polling_active
    }
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "sk_test_51...your_test_key...") # Placeholder or read from env

@app.get("/create-checkout-session", tags=["Payments"])
async def create_checkout_session():
    """
    Creates a Stripe Checkout Session for Premium subscription and redirects to it.
    """
    try:
        price_mxn = firebase_service.get_premium_price()
        session = stripe.checkout.Session.create(
            payment_method_types=['card'],
            line_items=[
                {
                    'price_data': {
                        'currency': 'mxn',
                        'product_data': {
                            'name': 'A la olla Premium (Acceso Mensual)',
                            'description': 'Acceso sin límites a alertas de valor y modo irreverente.',
                        },
                        'unit_amount': price_mxn * 100, # Dinámico desde Firestore en Pesos Mexicanos (ej. 300 MXN)
                        'recurring': {
                            'interval': 'month',
                        },
                    },
                    'quantity': 1,
                },
            ],
            mode='subscription',
            success_url='http://localhost:8000/success',
            cancel_url='http://localhost:8000/cancel',
        )
        return RedirectResponse(url=session.url)
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/success", tags=["Payments"])
async def success():
    return {"message": "¡Pago exitoso! Bienvenido a A la olla Premium."}

@app.get("/cancel", tags=["Payments"])
async def cancel():
    return {"message": "Pago cancelado. Si tienes dudas, contáctanos."}

if __name__ == "__main__":
    import uvicorn
    # Run server locally on port 8000
    uvicorn.run("app:app", host="0.0.0.0", port=8000, reload=False)
