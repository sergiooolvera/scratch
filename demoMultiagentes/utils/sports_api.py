import os
import json
import urllib.request
import urllib.parse
from difflib import SequenceMatcher

def get_odds_api_key():
    return os.getenv("THE_ODDS_API_KEY", "").strip()

def match_teams(event_name, api_events):
    """Encuentra el evento en la API que mejor coincide con el nombre del evento buscado."""
    best_match = None
    highest_ratio = 0.0
    
    # Normalizar el nombre buscado
    search_name = event_name.lower().replace("vs", " ").replace("contra", " ").strip()
    
    for event in api_events:
        home_team = event.get("home_team", "")
        away_team = event.get("away_team", "")
        api_event_name = f"{home_team} {away_team}".lower()
        
        # Comparar similitud de strings
        ratio = SequenceMatcher(None, search_name, api_event_name).ratio()
        if ratio > highest_ratio and ratio > 0.4:
            highest_ratio = ratio
            best_match = event
            
    return best_match, highest_ratio

def get_odds_for_event(event_name: str) -> dict:
    """Busca cuotas de apuesta en tiempo real para el evento dado."""
    api_key = get_odds_api_key()
    if not api_key:
        print("[Sports API] THE_ODDS_API_KEY no configurada. Usando fallback de búsqueda web.")
        return {"status": "fallback", "reason": "No API Key configured"}

    # Determinar el deporte más probable basado en el texto del evento
    event_lower = event_name.lower()
    sport = "upcoming" # Default a todos los deportes futuros
    
    # Mapeo simple de palabras clave a deportes de The Odds API
    if any(k in event_lower for k in ["dodgers", "padres", "yankees", "red sox", "mlb", "béisbol", "beisbol"]):
        sport = "baseball_mlb"
    elif any(k in event_lower for k in ["lakers", "celtics", "nba", "basketball", "baloncesto"]):
        sport = "basketball_nba"
    elif any(k in event_lower for k in ["real madrid", "barcelona", "fc", "fútbol", "futbol", "champions", "premier", "la liga"]):
        sport = "soccer_uefa_champs_league" # Se puede generalizar
    
    url = f"https://api.the-odds-api.com/v4/sports/{sport}/odds/?apiKey={api_key}&regions=us,eu&markets=h2h&oddsFormat=decimal"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            data = json.loads(response.read().decode('utf-8'))
            
            # Buscar el partido coincidente en la lista de eventos devueltos
            matched_event, ratio = match_teams(event_name, data)
            
            if matched_event and ratio > 0.5:
                print(f"[Sports API] Coincidencia encontrada ({int(ratio*100)}% de similitud): {matched_event['home_team']} vs {matched_event['away_team']}")
                
                # Consolidar cuotas
                bookmakers = matched_event.get("bookmakers", [])
                odds_summary = {
                    "home_team": matched_event.get("home_team"),
                    "away_team": matched_event.get("away_team"),
                    "commence_time": matched_event.get("commence_time"),
                    "odds": []
                }
                
                # Extraer las primeras 3 casas de apuestas disponibles
                for bm in bookmakers[:3]:
                    markets = bm.get("markets", [])
                    if markets:
                        outcomes = markets[0].get("outcomes", [])
                        odds_entry = {"bookmaker": bm.get("title")}
                        for out in outcomes:
                            odds_entry[out.get("name")] = out.get("price")
                        odds_summary["odds"].append(odds_entry)
                        
                return {"status": "success", "data": odds_summary}
            else:
                print(f"[Sports API] No se encontró coincidencia clara en The Odds API para '{event_name}'.")
                return {"status": "fallback", "reason": "No matching event found in API"}
                
    except Exception as e:
        print(f"[Sports API] Error al conectar con The Odds API: {e}")
        return {"status": "fallback", "reason": f"API error: {str(e)}"}
