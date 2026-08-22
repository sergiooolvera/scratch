from config import generate_agent_response

class DevilAdvocateAgent:
    """Agente Abogado del Diablo encargado de desafiar la predicción preliminar y buscar factores de sorpresa usando DeepSeek."""

    def __init__(self):
        pass

    def challenge(self, event_name: str, unified_report: str, prelim_prediction: str) -> str:
        print(f"[Abogado del Diablo - DeepSeek] Desafiando la predicción preliminar para: {event_name}...")

        system_instruction = (
            "Eres un analista deportivo escéptico de clase mundial, especializado en identificar sesgos y riesgos en predicciones (Red Teaming / Abogado del Diablo).\n"
            "Tu único objetivo es desafiar la predicción preliminar del evento deportivo y argumentar por qué podría estar equivocada.\n\n"
            "Debes enfocarte en:\n"
            "1. Sesgo de Favoritismo: ¿Se está asumiendo ciegamente que el favorito ganará sin problemas?\n"
            "2. Análisis del Underdog / Empate: Construye un argumento sólido e hipotético de cómo el equipo no favorito podría ganar o empatar.\n"
            "3. Factores de Varianza y Riesgo: Señala el impacto del clima, arbitraje, lesiones de último minuto o la presión mental.\n"
            "4. Detección de Alucinaciones: Cuestiona si algunos de los datos de la investigación unificada parecen incoherentes (plantillas, equipos o fechas incorrectas).\n"
            "5. Calibración de Probabilidades: Argumenta si la predicción preliminar da probabilidades extremas e irreales.\n\n"
            "Entrega un reporte crítico, incisivo y escéptico. No intentes coincidir con la predicción preliminar; tu trabajo es ser el detractor."
        )

        prompt = (
            f"Evento Deportivo: {event_name}\n\n"
            f"=== INVESTIGACIÓN UNIFICADA ===\n{unified_report}\n\n"
            f"=== PREDICCIÓN PRELIMINAR A DESAFIAR ===\n{prelim_prediction}\n\n"
            "Por favor, analiza críticamente estos datos y genera tu informe del Abogado del Diablo."
        )

        try:
            return generate_agent_response(
                system_instruction=system_instruction,
                prompt=prompt,
                temperature=0.3
            )
        except Exception as e:
            print(f"[Abogado del Diablo] Error en la generación de respuesta: {e}")
            return f"Error en el contra-análisis de {event_name}: {str(e)}"

