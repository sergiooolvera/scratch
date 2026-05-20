import sys
import os
import asyncio

# Add the parent folder to the python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from firebase_service import FirebaseService
from simulator import MatchSimulator

async def main():
    print("Initializing Firebase Service...")
    firebase = FirebaseService(service_account_path="firebase_service_account.json")
    if not firebase.enabled:
        print("Firebase disabled!")
        return
        
    print("Starting Match Simulator...")
    # 1.5 seconds per minute means a super fun live experience for the user!
    simulator = MatchSimulator(db_service=firebase, speed_factor=1.5)
    
    print("Simulating a 'late_storm' match (Monterrey vs Tigres) in real time...")
    # This task runs in the background
    await simulator.start_match_simulation("sim_tigres_monterrey", "late_storm")
    
    # Keep the script running to allow the simulation loop to tick
    # 90 minutes * 1.5 seconds = 135 seconds of live action!
    print("Simulation started. Keeping script alive for 135 seconds...")
    await asyncio.sleep(135)
    print("Simulation completed successfully.")

if __name__ == "__main__":
    asyncio.run(main())
