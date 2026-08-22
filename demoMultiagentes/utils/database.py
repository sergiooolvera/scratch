import sqlite3
import os
import json
from datetime import datetime

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "predictions.db")

def get_connection():
    return sqlite3.connect(DB_PATH)

def init_db():
    """Inicializa la base de datos y crea la tabla de predicciones si no existe."""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS predictions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_name TEXT NOT NULL,
            prediction_date TEXT NOT NULL,
            predicted_winner TEXT,
            prelim_probability REAL,
            final_probability REAL,
            confidence_level TEXT,
            odds_data TEXT,
            predicted_score TEXT,
            actual_result TEXT DEFAULT 'PENDING',
            actual_winner TEXT,
            actual_score TEXT
        )
    """)
    conn.commit()
    conn.close()

def save_prediction(event_name, predicted_winner, prelim_probability, final_probability, confidence_level, odds_data, predicted_score):
    """Guarda una nueva predicción en estado PENDING."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    
    # Serializar cuotas de apuestas si es diccionario
    if isinstance(odds_data, (dict, list)):
        odds_data = json.dumps(odds_data)
        
    date_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    cursor.execute("""
        INSERT INTO predictions (event_name, prediction_date, predicted_winner, prelim_probability, final_probability, confidence_level, odds_data, predicted_score)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    """, (event_name, date_str, predicted_winner, prelim_probability, final_probability, confidence_level, odds_data, predicted_score))
    
    pred_id = cursor.lastrowid
    conn.commit()
    conn.close()
    return pred_id

def get_pending_predictions():
    """Obtiene las predicciones que aún no han sido resueltas."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT id, event_name, prediction_date, predicted_winner, final_probability, predicted_score FROM predictions WHERE actual_result = 'PENDING'")
    rows = cursor.fetchall()
    conn.close()
    return [{"id": r[0], "event_name": r[1], "date": r[2], "predicted_winner": r[3], "final_probability": r[4], "predicted_score": r[5]} for r in rows]

def resolve_prediction(pred_id, actual_result, actual_winner, actual_score):
    """Actualiza una predicción con su resultado real."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        UPDATE predictions 
        SET actual_result = ?, actual_winner = ?, actual_score = ?
        WHERE id = ?
    """, (actual_result, actual_winner, actual_score, pred_id))
    conn.commit()
    conn.close()

def get_learning_context(limit=5):
    """Obtiene un historial de predicciones resueltas (éxitos y fallos) para inyectar como aprendizaje."""
    init_db()
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute("""
        SELECT event_name, predicted_winner, final_probability, predicted_score, actual_result, actual_winner, actual_score 
        FROM predictions 
        WHERE actual_result != 'PENDING'
        ORDER BY id DESC
        LIMIT ?
    """, (limit,))
    rows = cursor.fetchall()
    conn.close()
    
    if not rows:
        return ""
        
    context = "=== LECCIONES DE PREDICCIONES PASADAS ===\n"
    for r in rows:
        status = "ACERTADA (HIT)" if r[4] == "HIT" else "FALLIDA (MISS)"
        context += (
            f"- Evento: {r[0]}\n"
            f"  Predicción: Gana {r[1]} con prob. de {r[2]}% (Marcador estimado: {r[3]})\n"
            f"  Resultado Real: Ganador: {r[5]} (Marcador real: {r[6]}) -> {status}\n\n"
        )
    return context
