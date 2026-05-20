import os
import logging
from typing import Dict, Any, Optional, List
import firebase_admin
from firebase_admin import credentials, firestore, messaging

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("FirebaseService")

class FirebaseService:
    def __init__(self, service_account_path: Optional[str] = None):
        self.service_account_path = service_account_path or "firebase_service_account.json"
        self.db = None
        self.enabled = False
        self._initialize_firebase()

    def _initialize_firebase(self):
        """Initializes the Firebase Admin SDK safely."""
        try:
            if os.path.exists(self.service_account_path):
                logger.info(f"Initializing Firebase Admin SDK using key: {self.service_account_path}")
                cred = credentials.Certificate(self.service_account_path)
                
                try:
                    # Check if already initialized to avoid "The default Firebase app already exists" error
                    firebase_admin.get_app()
                    logger.info("Firebase Admin SDK is already initialized. Reusing active connection.")
                except ValueError:
                    firebase_admin.initialize_app(cred)
                    
                self.db = firestore.client()
                self.enabled = True
                logger.info("Firebase Admin SDK successfully initialized! Firestore is ENABLED.")
            else:
                logger.warning(f"Firebase Service Account file NOT FOUND at: {self.service_account_path}")
                logger.warning("Firebase integration is DISABLED. Backend will run in LOCAL MEMORY mode.")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase Admin SDK: {e}")
            self.enabled = False

    async def update_live_match(self, match_id: str, match_state: Dict[str, Any]):
        """Saves or updates live match statistics and odds in Firestore."""
        if not self.enabled:
            return
            
        try:
            # Firestore document path: /live_matches/{match_id}
            doc_ref = self.db.collection("live_matches").document(match_id)
            # We run this synchronous firestore write in a separate thread if needed,
            # but for our simple backend, standard call is fast enough
            doc_ref.set(match_state)
            logger.debug(f"[Firebase] Saved live match state for {match_id} in Firestore.")
        except Exception as e:
            logger.error(f"[Firebase] Error saving live match {match_id} in Firestore: {e}")

    async def push_live_alert(self, alert_data: Dict[str, Any]):
        """
        Pushes a new alert to Firestore and triggers a push notification
        to all subscribed devices using Firebase Cloud Messaging (FCM).
        """
        if not self.enabled:
            return
            
        try:
            # 1. Save alert to Firestore: /alerts/{uuid/auto-generated-id}
            alert_ref = self.db.collection("alerts").document()
            alert_id = alert_ref.id
            alert_data["id"] = alert_id
            alert_data["created_at"] = firestore.SERVER_TIMESTAMP
            alert_data["status"] = "pending" # Default status for tracking
            alert_ref.set(alert_data)
            logger.info(f"[Firebase] Saved alert {alert_id} in Firestore collection '/alerts'.")
            
            # 2. Trigger FCM Notification to 'alerts' topic
            # Mobile devices will subscribe to this topic to receive real-time notifications
            topic = "alerts"
            
            # Send normal description in notification, but include spicy one in data payload
            message = messaging.Message(
                notification=messaging.Notification(
                    title=alert_data["title"],
                    body=alert_data["description"]
                ),
                data={
                    "market": alert_data["market"],
                    "match_id": alert_data["match_id"],
                    "line": str(alert_data["line"]),
                    "odds": str(alert_data["odds"]),
                    "description_spicy": alert_data.get("description_spicy", "")
                },
                topic=topic
            )
            
            # Send message asynchronously in FCM with time restrictions for May 10, 2026
            from datetime import datetime
            now = datetime.now()
            
            is_allowed_time = True
            is_red_card = alert_data.get("market") == "RedCard"
            bypass_restriction = alert_data.get("bypass_time_restriction", False)
            
            # Specific restriction for May 10, 2026 (8:00 AM to 2:00 PM)
            if now.year == 2026 and now.month == 5 and now.day == 10:
                if not (8 <= now.hour < 14):
                    if is_red_card:
                        logger.info(f"[Firebase] Time window restriction active, but BYPASSING for high-priority RedCard alert.")
                    elif bypass_restriction:
                        logger.info(f"[Firebase] Time window restriction active, but BYPASSING due to explicit bypass flag.")
                    else:
                        is_allowed_time = False
                        logger.info(f"[Firebase] FCM notification SUPPRESSED. Time {now.strftime('%H:%M:%S')} is outside the allowed 08:00 - 14:00 window for today (May 10).")
            
            if is_allowed_time:
                response = messaging.send(message)
                logger.info(f"[Firebase] Sent FCM Push Notification to topic '{topic}'. Response ID: {response}")
            else:
                logger.info("[Firebase] Suppressing FCM Push Notification due to active time window constraint. Alert remains saved in Firestore database.")
            
        except Exception as e:
            logger.error(f"[Firebase] Error publishing live alert or FCM: {e}")

    async def get_pending_alerts(self) -> List[Dict[str, Any]]:
        """Fetches all alerts with status 'pending' from Firestore."""
        if not self.enabled:
            return []
        try:
            docs = self.db.collection("alerts").where("status", "==", "pending").stream()
            alerts = []
            for doc in docs:
                data = doc.to_dict()
                data["id"] = doc.id
                alerts.append(data)
            return alerts
        except Exception as e:
            logger.error(f"[Firebase] Error fetching pending alerts: {e}")
            return []

    async def update_alert_status(self, alert_id: str, status: str):
        """Updates the status of an alert in Firestore."""
        if not self.enabled:
            return
        try:
            self.db.collection("alerts").document(alert_id).update({"status": status})
            logger.info(f"[Firebase] Updated alert {alert_id} status to {status}.")
        except Exception as e:
            logger.error(f"[Firebase] Error updating alert {alert_id} status: {e}")

    async def get_alert_templates(self) -> Dict[str, Any]:
        """Fetches all alert templates from Firestore."""
        if not self.enabled:
            return {}
        try:
            docs = self.db.collection("alert_templates").stream()
            templates = {}
            for doc in docs:
                templates[doc.id] = doc.to_dict()
            return templates
        except Exception as e:
            logger.error(f"[Firebase] Error fetching alert templates: {e}")
            return {}

    def cleanup_old_data(self):
        """Deletes alerts and live matches older than 7 days from Firestore."""
        if not self.enabled:
            return
        try:
            from datetime import datetime, timedelta
            limit_date = datetime.utcnow() - timedelta(days=7)
            
            # Delete old alerts
            alerts_ref = self.db.collection("alerts")
            
            # Deletes mock test alert used during initial connection verification
            try:
                alerts_ref.document("test_alert_1").delete()
            except Exception:
                pass

            old_alerts = alerts_ref.where("created_at", "<", limit_date).stream()
            deleted_alerts = 0
            for doc in old_alerts:
                doc.reference.delete()
                deleted_alerts += 1
                
            # Delete old finished live matches (minute > 95)
            matches_ref = self.db.collection("live_matches")
            old_matches = matches_ref.stream()
            deleted_matches = 0
            for doc in old_matches:
                data = doc.to_dict()
                minute = data.get("minute", 0)
                if minute > 95:
                    doc.reference.delete()
                    deleted_matches += 1
            
            logger.info(f"[Firebase Cleanup] Automatically cleaned up: deleted {deleted_alerts} old alerts (>7 days) and {deleted_matches} finished live matches.")
        except Exception as e:
            logger.error(f"[Firebase Cleanup] Error during data cleanup: {e}")
            
# Quick test if run directly
if __name__ == "__main__":
    # Create instance. Will gracefully fall back to local mode if key is missing.
    service = FirebaseService()
