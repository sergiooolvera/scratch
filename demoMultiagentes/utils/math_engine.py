import json

def calculate_base_probability(stats_json_str: str, news_json_str: str) -> dict:
    """
    Calcula un índice de probabilidad base balanceado usando las puntuaciones JSON
    provistas por el Analista Estadístico y el Analista de Noticias.
    """
    try:
        stats = json.loads(stats_json_str)
    except Exception:
        stats = {}

    try:
        news = json.loads(news_json_str)
    except Exception:
        news = {}

    # 1. Componente de Rendimiento Estadístico (S)
    h2h = float(stats.get("h2h_home_win_ratio", 0.5))
    win_home = float(stats.get("home_win_ratio_last_10", 0.5))
    win_away = float(stats.get("away_win_ratio_last_10", 0.5))
    
    # Proporción de victorias de últimos partidos
    win_ratio_comb = 0.5
    if (win_home + win_away) > 0:
        win_ratio_comb = win_home / (win_home + win_away)
        
    s_score = (0.5 * h2h) + (0.5 * win_ratio_comb)

    # 2. Componente de Contexto y Noticias (C)
    home_abs = float(news.get("home_absences_impact", 0.2)) # 0 a 1 (1 = catastrófico)
    away_abs = float(news.get("away_absences_impact", 0.2))
    
    home_mot = float(news.get("home_motivation_factor", 0.7)) # 0 a 1
    away_mot = float(news.get("away_motivation_factor", 0.7))
    
    home_rest = float(news.get("home_rest_days", 4))
    away_rest = float(news.get("away_rest_days", 4))

    # Ponderaciones cualitativas
    mot_ratio = 0.5
    if (home_mot + away_mot) > 0:
        mot_ratio = home_mot / (home_mot + away_mot)
        
    # El impacto de ausencias resta fuerza
    abs_impact = 0.5 + ((away_abs - home_abs) * 0.3)
    
    # Descanso
    rest_ratio = 0.5
    if (home_rest + away_rest) > 0:
        rest_ratio = home_rest / (home_rest + away_rest)
        
    c_score = (0.4 * mot_ratio) + (0.4 * abs_impact) + (0.2 * rest_ratio)

    # 3. Componente de Probabilidad Implícita de Mercado (M)
    market_prob_home = stats.get("implied_market_prob_home", None)
    
    if market_prob_home is not None:
        market_prob_home = float(market_prob_home)
        # Integrar la cuota de mercado con peso del 50%, estadísticas 30% y noticias 20%
        final_home_prob = (0.5 * market_prob_home) + (0.3 * s_score) + (0.2 * c_score)
    else:
        # Si no hay cuota de mercado, usar 60% estadísticas y 40% noticias
        final_home_prob = (0.6 * s_score) + (0.4 * c_score)

    # Asegurar límites lógicos entre 0.05 y 0.95
    final_home_prob = max(0.05, min(0.95, final_home_prob))
    
    prob_home_pct = int(round(final_home_prob * 100))
    prob_away_pct = 100 - prob_home_pct

    return {
        "math_home_probability": prob_home_pct,
        "math_away_probability": prob_away_pct,
        "statistical_strength": int(round(s_score * 100)),
        "contextual_strength": int(round(c_score * 100)),
        "market_prob_home_pct": int(round(market_prob_home * 100)) if market_prob_home is not None else None
    }
