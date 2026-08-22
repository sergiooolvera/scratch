import os
import json
from google.genai import types
from config import get_gemini_client, generate_content_with_retry
from utils.database import get_pending_predictions, resolve_prediction

def resolve_all_pending():
    pending = get_pending_predictions()
    if not pending:
        print("[Resolutor] No hay predicciones pendientes por resolver en la base de datos.")
        return

    client = get_gemini_client()
    model_name = "gemini-2.5-flash"
    
    print(f"[Resolutor] Detectados {len(pending)} partidos pendientes. Buscando resultados reales...")

    for pred in pending:
        event_name = pred["event_name"]
        predicted_winner = pred["predicted_winner"]
        pred_id = pred["id"]
        
        print(f"\n[Resolutor] Investigando resultado real de: '{event_name}' (Pronóstico: Gana {predicted_winner})...")
        
        system_instruction = (
            "Eres un auditor y recolector de datos deportivos oficial. "
            "Tu tarea es investigar el resultado final de la vida real para el evento deportivo indicado.\n\n"
            "Debes:\n"
            "1. Buscar el marcador final y quién ganó el partido.\n"
            "2. Si el partido fue cancelado, pospuesto o no se ha jugado aún, indícalo claramente.\n"
            "3. Responder ÚNICAMENTE con un objeto JSON formateado que tenga la siguiente estructura:\n"
            "{\n"
            "  \"status\": \"played\" o \"postponed\" o \"not_played\",\n"
            "  \"winner\": \"Nombre del equipo ganador en la vida real\" o \"Draw\" (empate) o \"None\",\n"
            "  \"score\": \"Marcador final (ej. 4-2, 5-5)\"\n"
            "}"
        )
        
        prompt = f"Busca el resultado final de la vida real para el partido: {event_name} jugado cerca de la fecha {pred['date']}"
        
        try:
            response = generate_content_with_retry(
                client=client,
                model=model_name,
                contents=prompt,
                config=types.GenerateContentConfig(
                    system_instruction=system_instruction,
                    tools=[{"google_search": {}}],
                    temperature=0.1
                )
            )
            
            # Limpiar y parsear JSON
            json_text = response.text.strip()
            if "```json" in json_text:
                json_text = json_text.split("```json")[1].split("```")[0].strip()
            elif "```" in json_text:
                json_text = json_text.split("```")[1].strip()
                
            result_data = json.loads(json_text)
            
            status = result_data.get("status", "not_played")
            actual_winner = result_data.get("winner", "None")
            actual_score = result_data.get("score", "None")
            
            if status == "played":
                # Determinar si la predicción fue acertada o fallida
                # Comparar con el ganador previsto (ignorar mayúsculas y acentos)
                pred_winner_norm = predicted_winner.lower().strip()
                act_winner_norm = actual_winner.lower().strip()
                
                # Coincidencia flexible de nombres
                if pred_winner_norm in act_winner_norm or act_winner_norm in pred_winner_norm:
                    result_status = "HIT"
                    print(f"  -> [HIT] ¡Predicción acertada! Ganó: {actual_winner} ({actual_score})")
                else:
                    result_status = "MISS"
                    print(f"  -> [MISS] Predicción fallida. Ganó: {actual_winner} ({actual_score})")
                    
                resolve_prediction(pred_id, result_status, actual_winner, actual_score)
            else:
                print(f"  -> [PENDIENTE] El partido aún no se ha jugado o fue pospuesto.")
                
        except Exception as e:
            print(f"  -> [Error] No se pudo resolver el partido {event_name}: {e}")

if __name__ == "__main__":
    resolve_all_pending()
