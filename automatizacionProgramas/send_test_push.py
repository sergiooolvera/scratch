import sys
import os
import asyncio
from datetime import datetime

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from firebase_service import FirebaseService

async def send_real_push():
    print("Initializing Firebase Service to send a REAL test push notification...")
    firebase = FirebaseService(service_account_path="firebase_service_account.json")
    
    if not firebase.enabled:
        print("[ERROR] Firebase Admin SDK is not enabled. Make sure 'firebase_service_account.json' is present.")
        return

    # Let's construct a test alert
    alert_data = {
        "match_id": "test_push_redcard",
        "market": "RedCard",
        "title": "🚨 ¡TARJETA ROJA EN VIVO! (America vs Cruz Azul)",
        "description": "Tarjeta roja para el equipo visitante (Cruz Azul) en el minuto 18. Marcador: 0-0. Oportunidad para buscar mercados de hándicap o goles.",
        "line": 1.0,
        "odds": 1.0,
        "prob_real": 100.0,
        "prob_implied": 100.0,
        "edge": 0.0
    }

    print("\nSending FCM notification to topic 'alerts'...")
    await firebase.push_live_alert(alert_data)
    print("\n=== Push test process completed! ===")

if __name__ == "__main__":
    asyncio.run(send_real_push())
