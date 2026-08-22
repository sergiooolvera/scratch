from config import generate_agent_response

class PredictorAgent:
    """Agente experto en apuestas y pronósticos deportivos que consolida la investigación y el contra-análisis usando DeepSeek como motor primario."""
    
    def __init__(self):
        pass

    def predict(self, event_name: str, unified_report: str, devil_advocate_report: str = None, math_probability_report: str = "", learning_context: str = "") -> str:
        if devil_advocate_report is None:
            print(f"[Pronosticador - DeepSeek] Calculando predicción PRELIMINAR a profundidad para: {event_name}...")
            system_instruction = (
                "Eres un analista deportivo profesional, experto en probabilidades y pronósticos de alta precisión.\n"
                "Tu tarea es recibir el informe de investigación unificada (estadísticas, noticias y tendencias) para generar una propuesta preliminar de pronóstico.\n\n"
                "Deberás:\n"
                "1. Analizar la información y estimar probabilidades de victoria y marcador estimado con análisis profundo.\n"
                "2. Tomar en cuenta el Índice de Probabilidad Matemática Base como tu ancla numérica inicial.\n"
                "3. Revisar el historial de Lecciones de Predicciones Pasadas para evitar sesgos cometidos en eventos similares.\n"
                "Sé objetivo y basa tus estimaciones en la información provista."
            )
            prompt = (
                f"Evento Deportivo: {event_name}\n\n"
                f"{learning_context}\n"
                f"=== PROBABILIDAD MATEMÁTICA BASE ===\n{math_probability_report}\n\n"
                f"=== INFORME DE INVESTIGACIÓN UNIFICADA ===\n{unified_report}\n\n"
                "Genera la propuesta preliminar de pronóstico detallada."
            )
        else:
            print(f"[Pronosticador - DeepSeek] Consolidando reporte final y sintetizando veredicto calibrado para: {event_name}...")
            system_instruction = (
                "Eres un analista deportivo profesional experto en gestión de riesgos y probabilidades de alta precisión.\n"
                "Tu tarea es consolidar la investigación unificada, el reporte de probabilidad matemática y la crítica del Abogado del Diablo para emitir un VEREDICTO DEFINITIVO Y SINTETIZADO.\n\n"
                "Directrices estrictas de formato de salida:\n"
                "1. **FICHA RESUMEN EJECUTIVA (OBLIGATORIA AL INICIO):** Inicia tu respuesta OBLIGATORIAMENTE con un bloque sintético y directo de la siguiente forma:\n"
                "   📌 **VEREDICTO SINTETIZADO**\n"
                "   - **Evento:** <Nombre del Evento>\n"
                "   - **Ganador Pronosticado:** <Equipo / Jugador>\n"
                "   - **Marcador Estimado:** <Ejemplo: 2-1>\n"
                "   - **Probabilidad Calibrada:** <Porcentaje final>%\n"
                "   - **Nivel de Confianza:** <Bajo | Medio | Alto>\n"
                "   - **Puntos Clave (Sintetizados):**\n"
                "     * 1. <Razón clave 1>\n"
                "     * 2. <Razón clave 2>\n"
                "     * 3. <Razón clave 3>\n\n"
                "2. **ANÁLISIS EN PROFUNDIDAD:** A continuación de la Ficha Resumen, incluye el análisis exhaustivo detallando la calibración de riesgos, el choque de estadísticas y las lecciones aprendidas.\n"
                "3. **AL FINAL DE TU REPORTE:** Incluye OBLIGATORIAMENTE el bloque JSON de metadatos en triple comilla invertida con la etiqueta json:\n"
                "```json\n"
                "{\n"
                "  \"predicted_winner\": \"Nombre exacto del ganador\",\n"
                "  \"prelim_probability\": 60,\n"
                "  \"final_probability\": 51,\n"
                "  \"confidence_level\": \"bajo\" o \"medio\" o \"alto\",\n"
                "  \"predicted_score\": \"Marcador estimado (ej. 2-1)\"\n"
                "}\n"
                "```"
            )
            prompt = (
                f"Evento Deportivo: {event_name}\n\n"
                f"{learning_context}\n"
                f"=== PROBABILIDAD MATEMÁTICA BASE ===\n{math_probability_report}\n\n"
                f"=== INFORME DE INVESTIGACIÓN UNIFICADA ===\n{unified_report}\n\n"
                f"=== CRÍTICA DEL ABOGADO DEL DIABLO ===\n{devil_advocate_report}\n\n"
                "Por favor, genera el reporte de pronóstico FINAL calibrado iniciando OBLIGATORIAMENTE con la Ficha Resumen Ejecutiva Sintetizada."
            )

        try:
            return generate_agent_response(
                system_instruction=system_instruction,
                prompt=prompt,
                temperature=0.3
            )
        except Exception as e:
            print(f"[Pronosticador] Error en la generación de respuesta: {e}")
            return f"Error en la predicción de {event_name}: {str(e)}"


