import os
import sys
import json
import time
from google.genai import types
from config import get_gemini_client
from agents.unified_analyst import UnifiedAnalystAgent
from agents.predictor import PredictorAgent
from agents.devil_advocate import DevilAdvocateAgent
from utils.database import init_db, save_prediction, get_learning_context
from utils.sports_api import get_odds_for_event
from utils.math_engine import calculate_base_probability

def extract_meta_from_text(text: str) -> dict:
    """Extrae localmente el bloque JSON de metadatos del reporte final sin usar llamadas adicionales a la API."""
    try:
        if "```json" in text:
            # Buscar el último bloque JSON que suele ser el de los metadatos
            parts = text.split("```json")
            json_candidate = parts[-1].split("```")[0].strip()
            return json.loads(json_candidate)
    except Exception as e:
        print(f"[Orquestador] Error al parsear metadatos locales: {e}")
    
    return {
        "predicted_winner": "Desconocido",
        "prelim_probability": 50,
        "final_probability": 50,
        "confidence_level": "bajo",
        "predicted_score": "N/A"
    }

def main():
    init_db()
    
    if len(sys.argv) > 1:
        event_name = " ".join(sys.argv[1:])
    else:
        print("="*60)
        print("   PRONOSTICADOR DE EVENTOS DEPORTIVOS MULTIAGENTE AVANZADO (LITE)  ")
        print("="*60)
        event_name = input("Introduce el evento deportivo (ej: Real Madrid vs Barcelona): ").strip()
        
    if not event_name:
        print("[Error] El nombre del evento no puede estar vacío.")
        return

    print(f"\n[Orquestador] Iniciando flujo optimizado (3 Fases) para: '{event_name}'...\n")
    
    # 1. Obtener historial de aprendizaje
    learning_context = get_learning_context(limit=3)
    if learning_context:
        print("[Orquestador] Historial de aprendizaje cargado desde SQLite.")
        
    # 2. Consultar Odds API en tiempo real
    odds_result = get_odds_for_event(event_name)
    odds_data_str = ""
    if odds_result["status"] == "success":
        odds_data_str = json.dumps(odds_result["data"], indent=2)
        print("[Orquestador] Cuotas en tiempo real obtenidas exitosamente.")
    else:
        odds_data_str = f"No se obtuvieron cuotas vía API. Razón: {odds_result.get('reason')}"

    # 3. Instanciar agentes
    unified_agent = UnifiedAnalystAgent()
    predictor_agent = PredictorAgent()
    devil_agent = DevilAdvocateAgent()
    
    # 4. Fase 1: Investigación Unificada
    unified_report, unified_json = unified_agent.analyze(event_name, odds_data_str)
    print("[Orquestador] Fase 1: Investigación unificada completada.")
    time.sleep(2.5)
    
    # 5. Calcular Probabilidad Matemática Base
    # Se le pasa el mismo JSON unificado a ambos parámetros ya que contiene todas las claves requeridas
    math_res = calculate_base_probability(unified_json, unified_json)
    math_report = (
        f"- Probabilidad Matemática Local: {math_res['math_home_probability']}%\n"
        f"- Probabilidad Matemática Visitante: {math_res['math_away_probability']}%\n"
        f"- Fuerza Estadística: {math_res['statistical_strength']}/100\n"
        f"- Fuerza de Contexto: {math_res['contextual_strength']}/100"
    )
    if math_res.get('market_prob_home_pct') is not None:
        math_report += f"\n- Probabilidad Implícita de Mercado (API): {math_res['market_prob_home_pct']}%"
    print("[Orquestador] Cálculo matemático base finalizado.")

    # 6. Generar Predicción Preliminar
    prelim_prediction = predictor_agent.predict(
        event_name=event_name,
        unified_report=unified_report,
        math_probability_report=math_report,
        learning_context=learning_context
    )
    print("[Orquestador] Predicción preliminar calculada.")
    time.sleep(2.5)
    
    # 7. Fase 2: Contra-análisis del Abogado del Diablo
    devil_report = devil_agent.challenge(event_name, unified_report, prelim_prediction)
    print("[Orquestador] Fase 2: Contra-análisis del Abogado del Diablo completado.")
    time.sleep(2.5)
    
    # 8. Fase 3: Predicción Final Calibrada y Extracción
    final_prediction = predictor_agent.predict(
        event_name=event_name,
        unified_report=unified_report,
        devil_advocate_report=devil_report,
        math_probability_report=math_report,
        learning_context=learning_context
    )
    print("[Orquestador] Fase 3: Pronóstico final calibrado.")
    
    # 9. Extraer metadatos localmente del texto final y guardar
    meta = extract_meta_from_text(final_prediction)
    save_prediction(
        event_name=event_name,
        predicted_winner=meta.get("predicted_winner"),
        prelim_probability=meta.get("prelim_probability"),
        final_probability=meta.get("final_probability"),
        confidence_level=meta.get("confidence_level"),
        odds_data=odds_result.get("data") if odds_result["status"] == "success" else None,
        predicted_score=meta.get("predicted_score")
    )
    print("[Orquestador] Predicción registrada en SQLite en estado PENDING.")
    
    # 10. Guardar informe consolidado final
    output_filename = "pronostico_final.md"
    try:
        with open(output_filename, "w", encoding="utf-8") as f:
            f.write(f"# Informe Multiagente de Pronóstico Avanzado: {event_name}\n\n")
            f.write("## 1. Veredicto y Pronóstico Final Calibrado\n")
            f.write(f"{final_prediction}\n\n")
            f.write("---\n\n")
            f.write("## 2. Índice de Probabilidad Matemática Base\n")
            f.write(f"```yaml\n{math_report}\n```\n\n")
            f.write("---\n\n")
            f.write("## 3. Contra-análisis y Riesgos (Abogado del Diablo)\n")
            f.write(f"{devil_report}\n\n")
            f.write("---\n\n")
            f.write("## 4. Propuesta de Predicción Preliminar\n")
            f.write(f"{prelim_prediction}\n\n")
            f.write("---\n\n")
            f.write("## 5. Reporte de Investigación Unificada (Estadísticas, Noticias y Mercado)\n")
            f.write(f"{unified_report}\n\n")
            
        print("="*60)
        print(f"[Orquestador] ¡Flujo consolidado terminado exitosamente!")
        print(f"[Orquestador] Informe completo guardado en: {output_filename}")
        print("="*60)
        print("\n" + "="*60)
        print("           🏆 VEREDICTO FINAL SINTETIZADO (RESUMEN) 🏆           ")
        print("="*60)
        # Extraer la ficha del veredicto sintetizado si está presente al inicio
        if "📌 **VEREDICTO SINTETIZADO**" in final_prediction:
            summary_part = final_prediction.split("---")[0].strip()
            print(summary_part)
        else:
            # Imprimir las primeras 15 líneas como síntesis
            lines = final_prediction.splitlines()[:15]
            print("\n".join(lines))
        print("="*60 + "\n")
    except Exception as e:
        print(f"[Orquestador] Error al escribir el archivo de salida: {e}")


if __name__ == "__main__":
    main()
