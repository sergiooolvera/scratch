import math
import logging
from typing import Dict, Any, List, Optional

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("OddsEngine")

class OddsEngine:
    def __init__(self, min_edge: float = 0.05):
        """
        - min_edge: The minimum Expected Value (EV) edge required to trigger an alert (e.g., 0.05 = 5% edge).
        """
        self.min_edge = min_edge

    def _poisson_probability_over(self, lam: float, current: int, line: float) -> float:
        """
        Calculates the Poisson probability of achieving Over 'line' given:
        - lam: The expected mean lambda for the remaining minutes of the match.
        - current: Current events already recorded (e.g. current corners).
        - line: The Over/Under line (e.g., 8.5).
        
        To win Over 'line', the remaining events must be strictly greater than: line - current.
        Example: line = 8.5, current = 2. We need strictly more than 6.5 events remaining, meaning k >= 7.
        """
        target_remaining = math.ceil(line - current)
        if target_remaining <= 0:
            return 1.0 # Already won!
            
        # P(X >= k) = 1 - P(X < k) = 1 - sum_{i=0}^{k-1} (lambda^i * e^-lambda / i!)
        prob_under = 0.0
        for i in range(target_remaining):
            try:
                term = (math.pow(lam, i) * math.exp(-lam)) / math.factorial(i)
                prob_under += term
            except (OverflowError, ValueError):
                pass
                
        prob_over = 1.0 - prob_under
        return max(0.0, min(1.0, prob_over))

    def evaluate_match_opportunities(self, match_data: Dict[str, Any], live_stats: Dict[str, Any], templates: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        """
        Evaluates the match live stats against live odds of Caliente to detect +EV alerts.
        
        match_data contains:
        - home_team, away_team, minute, score_home, score_away
        - odds_ml (Money Line live)
        - odds_detail (Corners, Goals Over/Under, Yellow Cards, Asian Handicap live lines)
        
        live_stats contains (from Flashscore):
        - corners_home, corners_away, corners_total
        - yellow_cards_home, yellow_cards_away, yellow_cards_total
        - red_cards_home, red_cards_away, red_cards_total
        - dangerous_attacks_home, dangerous_attacks_away
        """
        alerts = []
        minute = match_data["minute"]
        
        # --- RED CARD DETECTOR (Before Minute 65) ---
        if minute < 65 and "red_cards_total" in live_stats and live_stats["red_cards_total"] > 0:
            red_home = live_stats.get("red_cards_home", 0)
            red_away = live_stats.get("red_cards_away", 0)
            
            # Formulate description based on which team got the card
            team_text = "¡Tarjeta roja en el partido!"
            if red_home > 0 or red_away > 0:
                if red_home > 0 and red_away > 0:
                    team_text = f"¡Tarjeta roja para ambos equipos! ({red_home} local, {red_away} visitante)"
                elif red_home > 0:
                    team_text = f"Tarjeta roja para el equipo local ({match_data['home_team']})"
                else:
                    team_text = f"Tarjeta roja para el equipo visitante ({match_data['away_team']})"
            else:
                # If home/away stats are not split, just alert about the card
                team_text = f"¡Tarjeta roja reportada en el partido! ({live_stats['red_cards_total']} total)"
                
            alerts.append({
                "market": "RedCard",
                "title": f"🚨 ¡TARJETA ROJA EN VIVO! ({match_data['home_team']} vs {match_data['away_team']})",
                "description": f"{team_text} en el minuto {minute}. Marcador: {match_data['score_home']}-{match_data['score_away']}. Oportunidad para buscar mercados de hándicap o goles.",
                "line": float(live_stats["red_cards_total"]),
                "odds": 1.0,
                "prob_real": 100.0,
                "prob_implied": 100.0,
                "edge": 0.0
            })
            
        # We only evaluate from minute 15 to 85 to ensure stable mathematical convergence
        if minute < 15 or minute > 85:
            return alerts
            
        remaining_minutes = 90 - minute
        
        # --- 1. CORNER KICKS VALUE BET DETECTION ---
        if "corners" in match_data["odds_detail"] and "corners_total" in live_stats:
            corners_info = match_data["odds_detail"]["corners"]
            current_corners = live_stats["corners_total"]
            live_line = corners_info["line"]
            live_odd_over = corners_info["over"]
            
            # Bayesian baseline estimation:
            # - Baseline corner rate: ~0.10 corners per minute (average for matches with pre-match line 8.5)
            # - Live corner rate so far: current_corners / minute
            # We blend these using a weight (favoring pre-match baseline early, and live rate later)
            w_pre = max(0.3, 1.0 - (minute / 90.0)) # Early in game, pre-match expectation is more relevant
            baseline_rate = 0.10
            live_rate = current_corners / minute if minute > 0 else baseline_rate
            expected_remaining_rate = (w_pre * baseline_rate) + ((1.0 - w_pre) * live_rate)
            
            # Calculate Poisson lambda for remaining minutes
            lam_corners = remaining_minutes * expected_remaining_rate
            
            # Calculate actual probability of hitting Over 'live_line'
            prob_real = self._poisson_probability_over(lam_corners, current_corners, live_line)
            
            # Implied probability by Caliente's odds
            prob_implied = 1.0 / live_odd_over if live_odd_over > 1.0 else 1.0
            
            # Calculate Expected Value (EV) Edge
            edge = (prob_real * live_odd_over) - 1.0
            
            logger.info(f"[{match_data['home_team']} vs {match_data['away_team']}] Corners Live Line: {live_line} | Current: {current_corners} | Expected Remaining lambda: {lam_corners:.2f} | Real Prob: {prob_real:.2%} | Implied Prob: {prob_implied:.2%} | EV Edge: {edge:.2%}")
            
            # Trigger Alert if edge is positive and above threshold, and game displays a temporary drought
            # (e.g. at least 30 minutes in, and current corners are low relative to minutes played)
            is_drought = current_corners < (minute * 0.07) # less than 0.07 corners/min so far
            if edge >= self.min_edge and is_drought and minute >= 20:
                alerts.append({
                    "market": "Corners",
                    "title": "🔥 Oportunidad de Córners en Vivo",
                    "description": f"Expectativa inicial alta, pero sequía temporal al min {minute} ({current_corners} córners). Línea recomendada: Over {live_line} córners.",
                    "description_spicy": f"🌶️ ¡La olla está hirviendo! Sequía de córners al min {minute} ({current_corners} cobrados). Las matemáticas dicen que van a llover tiros de esquina, ¡aprovecha el Over {live_line} ya!",
                    "line": live_line,
                    "odds": live_odd_over,
                    "prob_real": round(prob_real * 100, 1),
                    "prob_implied": round(prob_implied * 100, 1),
                    "edge": round(edge * 100, 1)
                })

        # --- 2. GOALS TOTALS (OVER/UNDER) VALUE BET DETECTION ---
        if "goals" in match_data["odds_detail"]:
            goals_info = match_data["odds_detail"]["goals"]
            current_goals = match_data["score_home"] + match_data["score_away"]
            live_line = goals_info["line"]
            live_odd_over = goals_info["over"]
            
            # Baseline goals rate: ~0.03 goals per minute (average for matches with pre-match line 2.5)
            # Live goals rate so far: current_goals / minute
            w_pre = max(0.4, 1.0 - (minute / 90.0))
            baseline_rate = 0.03
            live_rate = current_goals / minute if minute > 0 else baseline_rate
            expected_remaining_rate = (w_pre * baseline_rate) + ((1.0 - w_pre) * live_rate)
            
            # Calculate Poisson lambda for goals
            lam_goals = remaining_minutes * expected_remaining_rate
            
            prob_real = self._poisson_probability_over(lam_goals, current_goals, live_line)
            prob_implied = 1.0 / live_odd_over if live_odd_over > 1.0 else 1.0
            edge = (prob_real * live_odd_over) - 1.0
            
            logger.info(f"[{match_data['home_team']} vs {match_data['away_team']}] Goals Live Line: {live_line} | Current: {current_goals} | Expected Remaining lambda: {lam_goals:.2f} | Real Prob: {prob_real:.2%} | Implied Prob: {prob_implied:.2%} | EV Edge: {edge:.2%}")
            
            # Trigger goal alert if there's an offensive storm but no goals yet
            # e.g., high rate of dangerous attacks in the last few minutes
            is_offensive_storm = False
            if "dangerous_attacks_home" in live_stats:
                da_total = live_stats["dangerous_attacks_home"] + live_stats["dangerous_attacks_away"]
                # average dangerous attacks per minute is ~1.0; if it's high (e.g. > 1.3/min), there's high pressure
                is_offensive_storm = da_total > (minute * 1.3)
                
            if edge >= self.min_edge and is_offensive_storm and minute >= 25:
                alerts.append({
                    "market": "Goals",
                    "title": "⚽ Alerta de Goles: Presión Ofensiva Alta",
                    "description": f"Presión de ataque intensa al min {minute} con marcador {match_data['score_home']}-{match_data['score_away']}. Línea recomendada: Over {live_line} goles.",
                    "description_spicy": f"🌶️ ¡Se viene el grito de gol! Mucha presión ofensiva al min {minute} con marcador {match_data['score_home']}-{match_data['score_away']}. Ponle sabor al partido metiéndole al Over {live_line} goles antes de que caiga.",
                    "line": live_line,
                    "odds": live_odd_over,
                    "prob_real": round(prob_real * 100, 1),
                    "prob_implied": round(prob_implied * 100, 1),
                    "edge": round(edge * 100, 1)
                })

        # --- 3. HEAVY PRESSURE (LA OLLA A PRESIÓN) ---
        # Triggered if a team is dominating heavily but not winning
        pos_home = live_stats.get("possession_home", 50)
        pos_away = live_stats.get("possession_away", 50)
        sot_home = live_stats.get("shots_on_target_home", 0)
        sot_away = live_stats.get("shots_on_target_away", 0)
        xg_home = live_stats.get("xg_home", 0.0)
        xg_away = live_stats.get("xg_away", 0.0)
        
        home_is_dominating = pos_home > 65 and sot_home >= 3 and match_data["score_home"] <= match_data["score_away"]
        away_is_dominating = pos_away > 65 and sot_away >= 3 and match_data["score_away"] <= match_data["score_home"]
        
        if (home_is_dominating or away_is_dominating) and 15 <= minute <= 75:
            dominating_team = match_data["home_team"] if home_is_dominating else match_data["away_team"]
            
            # Default templates
            t_title = f"🍲 ¡EN LA OLLA! ({match_data['home_team']} vs {match_data['away_team']})"
            t_normal = f"🚨 La Olla a Presión: {dominating_team} domina con posesión y tiros pero no anota. Minuto {minute}. Marcador: {match_data['score_home']}-{match_data['score_away']}."
            t_spicy = f"🍲 ¡El {dominating_team} los tiene en la olla! Tienen el control absoluto pero no la meten. ¡No te quedes mirando y aprovecha el Próximo Gol antes de que sea tarde!"

            if templates and "HeavyPressure" in templates:
                temp = templates["HeavyPressure"]
                fmt_args = {
                    "home_team": match_data['home_team'],
                    "away_team": match_data['away_team'],
                    "dominating_team": dominating_team,
                    "minute": minute,
                    "score": f"{match_data['score_home']}-{match_data['score_away']}"
                }
                try:
                    t_title = temp.get("title", t_title).format(**fmt_args)
                    t_normal = temp.get("description_normal", t_normal).format(**fmt_args)
                    t_spicy = temp.get("description_spicy", t_spicy).format(**fmt_args)
                except Exception as e:
                    pass # Fallback to defaults if formatting fails

            alerts.append({
                "market": "HeavyPressure",
                "title": t_title,
                "description": t_normal,
                "description_spicy": t_spicy,
                "line": 0.5,
                "odds": 1.0,
                "prob_real": 100.0,
                "prob_implied": 100.0,
                "edge": 0.0,
                "is_safe": True if (xg_home > 1.2 or xg_away > 1.2) else False
            })

        # --- 4. TEST RULE: GOAL AFTER MINUTE 40 ---
        current_goals = match_data["score_home"] + match_data["score_away"]
        if minute > 40 and current_goals > 0:
            alerts.append({
                "market": "Goals",
                "title": "⚽ [TEST] Alerta de Gol Detectado",
                "description": f"¡Gol detectado después del minuto 40! Minuto {minute}. Marcador: {match_data['score_home']}-{match_data['score_away']}.",
                "line": 0.5,
                "odds": 1.0,
                "prob_real": 100.0,
                "prob_implied": 100.0,
                "edge": 0.0
            })

        return alerts

# Quick math test if run directly
if __name__ == "__main__":
    engine = OddsEngine(min_edge=0.05)
    
    # Let's simulate a game at minute 30, with only 1 corner kick
    match_test = {
        "home_team": "Pumas UNAM",
        "away_team": "Guadalajara",
        "minute": 30,
        "score_home": 0,
        "score_away": 0,
        "odds_detail": {
            "corners": {
                "line": 6.5, # line dropped from 8.5 to 6.5
                "over": 1.95, # high live odds!
                "under": 1.80
            },
            "goals": {
                "line": 0.5,
                "over": 1.80,
                "under": 1.95
            }
        }
    }
    
    stats_test = {
        "corners_total": 1, # only 1 corner in 30 minutes! DROUGHT!
        "dangerous_attacks_home": 25,
        "dangerous_attacks_away": 20 # 45 dangerous attacks total / 30 mins = 1.5 per minute! STORM!
    }
    
    opportunities = engine.evaluate_match_opportunities(match_test, stats_test)
    print("\nOPPORTUNITIES DETECTED BY ENGINE:")
    for op in opportunities:
        print(f"[{op['market']}] - {op['title']}")
        print(f"  Description: {op['description']}")
        print(f"  Line Recommended: Over {op['line']} | Odds: {op['odds']}")
        print(f"  Real Prob: {op['prob_real']}% | Implied Prob: {op['prob_implied']}% | Expected Edge: {op['edge']}%")
