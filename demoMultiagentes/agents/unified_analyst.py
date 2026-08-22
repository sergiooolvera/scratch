import json
from config import generate_agent_response

class UnifiedAnalystAgent:
    """Agente de Investigación Unificado encargado de recopilar estadísticas, noticias, lesiones y cuotas usando DeepSeek como motor primario."""

    def __init__(self):
        pass

    def analyze(self, event_name: str, odds_data_str: str) -> tuple:
        print(f"[Analista Unificado - DeepSeek] Iniciando investigación consolidada para: {event_name}...")

        system_instruction = (
            "Eres un analista de datos, periodista y experto en mercados deportivos de clase mundial.\n"
            "Tu objetivo es realizar una investigación exhaustiva y consolidada sobre el evento deportivo solicitado, abarcando estadísticas, contexto de noticias y tendencias de mercado.\n\n"
            "Debes enfocarte en:\n"
            "1. **Estadísticas e Historial:** Fecha real del evento, competición, enfrentamientos directos reales (Head-to-Head) y rendimiento en los últimos 5 a 10 partidos oficiales reales.\n"
            "2. **Noticias y Alineaciones:** Verificar si hay jugadores lesionados, suspendidos o convocados. Confirmar específicamente la disponibilidad de las estrellas del equipo.\n"
            "3. **Tendencias y Cuotas:** Reportar las cuotas de apuestas reales del mercado y analizar si hay movimientos de línea o variaciones significativas de cuotas.\n\n"
            "CRÍTICO: No utilices información de ligas virtuales o videojuegos. Tus fuentes deben ser noticias e información deportivas reales.\n\n"
            "AL FINAL DE TU REPORTE, debes incluir OBLIGATORIAMENTE un bloque JSON encerrado en triple comilla invertida con la etiqueta json conteniendo exactamente esta estructura (reemplaza con valores reales entre 0.0 y 1.0, o enteros, o nulo si no se encontraron):\n"
            "```json\n"
            "{\n"
            "  \"h2h_home_win_ratio\": 0.60, // Fracción de partidos ganados por el Local en H2H\n"
            "  \"home_win_ratio_last_10\": 0.70, // Fracción de victorias del Local en últimos 10 juegos\n"
            "  \"away_win_ratio_last_10\": 0.40, // Fracción de victorias del Visitante en últimos 10 juegos\n"
            "  \"implied_market_prob_home\": 0.65, // Probabilidad implícita en la cuota promedio del Local\n"
            "  \"home_absences_impact\": 0.20, // Gravedad de bajas del Local de 0.0 (ninguna) a 1.0 (crítica)\n"
            "  \"away_absences_impact\": 0.40, // Gravedad de bajas del Visitante de 0.0 a 1.0\n"
            "  \"home_motivation_factor\": 0.80, // Motivación del Local de 0.0 a 1.0\n"
            "  \"away_motivation_factor\": 0.60, // Motivación del Visitante de 0.0 a 1.0\n"
            "  \"home_rest_days\": 5, // Días transcurridos desde el último partido oficial del Local\n"
            "  \"away_rest_days\": 4 // Días transcurridos desde el último partido oficial del Visitante\n"
            "}\n"
            "```"
        )

        prompt = (
            f"Realiza la investigación y análisis completo del evento: {event_name}\n\n"
            f"=== CUOTAS ACTUALES DE LA API DE DEPORTES ===\n{odds_data_str}"
        )

        try:
            full_text = generate_agent_response(
                system_instruction=system_instruction,
                prompt=prompt,
                temperature=0.3
            )
            
            # Intentar extraer el JSON
            json_str = "{}"
            if "```json" in full_text:
                try:
                    parts = full_text.split("```json")
                    json_candidate = parts[1].split("```")[0].strip()
                    json_str = json_candidate
                except Exception:
                    pass
                    
            return full_text, json_str
            
        except Exception as e:
            print(f"[Analista Unificado] Error en la generación de respuesta: {e}")
            return f"Error en la investigación consolidada de {event_name}: {str(e)}", "{}"

