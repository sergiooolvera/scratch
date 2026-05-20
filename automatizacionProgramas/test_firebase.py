import sys
import os
import asyncio

# Add current folder to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from firebase_service import FirebaseService

async def main():
    print("Testing Firebase Firestore Connection...")
    
    # Initialize service
    firebase = FirebaseService(service_account_path="firebase_service_account.json")
    
    if not firebase.enabled:
        print("[ERROR] Firebase is still disabled! Check if the firebase_service_account.json is valid.")
        return
        
    print("[SUCCESS] Firebase initialized successfully!")
    print("Writing a test match to 'live_matches'...")
    
    try:
        # Create a test match document
        match_ref = firebase.db.collection("live_matches").document("test_match_1")
        match_data = {
            "id": "test_match_1",
            "home_team": "Real Madrid",
            "away_team": "Barcelona",
            "minute": 45,
            "score_home": 2,
            "score_away": 1,
            "status": "LIVE_TEST",
            "live_stats": {
                "corners_total": 5,
                "yellow_cards_total": 2,
                "red_cards_total": 0,
                "dangerous_attacks_home": 34,
                "dangerous_attacks_away": 28
            }
        }
        match_ref.set(match_data)
        print("-> Successfully wrote test match to 'live_matches'!")
        
        # Create a test alert document
        print("Writing a test alert to 'alerts'...")
        alert_ref = firebase.db.collection("alerts").document("test_alert_1")
        alert_data = {
            "id": "test_alert_1",
            "match_id": "test_match_1",
            "market": "RedCard",
            "title": "[TEST] CONNECTION SUCCESSFUL (Real Madrid vs Barcelona)",
            "description": "Your connection from Python to Firebase is 100% active. Push notifications are linked and ready.",
            "line": 0,
            "odds": 1.0,
            "prob_real": 100.0,
            "prob_implied": 100.0,
            "edge": 0.0
        }
        alert_ref.set(alert_data)
        print("-> Successfully wrote test alert to 'alerts'!")
        print("\n=== DONE! Go check your Firebase browser console right now, the new collections are visible! ===")
        
    except Exception as e:
        print(f"[ERROR] Error during Firestore operations: {e}")

if __name__ == "__main__":
    asyncio.run(main())
