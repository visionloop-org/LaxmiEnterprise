import asyncio
import httpx
import random
from datetime import datetime, timedelta
from typing import List, Dict

# Configuration
API_BASE_URL = "http://localhost:8000/api/v1"
USERNAME = "admin"
PASSWORD = "password123"

# Dummy data generators
FIRST_NAMES = ['Rajesh', 'Amit', 'Deepak', 'Ravi', 'Suresh', 'Mukesh', 'Vikram', 'Anil', 'Sunil', 'Prakash', 
               'Ramesh', 'Mahesh', 'Dinesh', 'Rajendra', 'Santosh', 'Krishna', 'Gopal', 'Narendra', 'Vijay', 'Ashok',
               'Rakesh', 'Mohan', 'Rahul', 'Vikas', 'Sanjay', 'Arun', 'Vinod', 'Pradeep', 'Pankaj', 'Raju']

LAST_NAMES = ['Singh', 'Kumar', 'Verma', 'Sharma', 'Patel', 'Yadav', 'Gupta', 'Joshi', 'Mehta', 'Prasad',
              'Lal', 'Kumar', 'Singh', 'Verma', 'Kumar', 'Yadav', 'Gupta', 'Joshi', 'Kumar', 'Sharma',
              'Kumar', 'Lal', 'Singh', 'Kumar', 'Verma', 'Yadav', 'Kumar', 'Kumar']

CATEGORIES = ['Workers', 'Drivers', 'Chalan Men', 'Office', 'Extra Labour']
CATEGORY_COUNTS = {'Workers': 17, 'Drivers': 7, 'Chalan Men': 5, 'Office': 3, 'Extra Labour': 2}

VEHICLE_TYPES = ['Tipper', 'JCB', 'Truck', 'Excavator']
STATES = ['MH', 'KA', 'DL', 'TN']

CONTRACTORS = ['ABC Construction', 'XYZ Infra', 'PQR Builders', 'LMN Contractors', 'EFG Works']

class DataSeeder:
    def __init__(self):
        self.client = httpx.AsyncClient(timeout=30.0, follow_redirects=True)
        self.token = None

    async def login(self):
        """Authenticate with the backend"""
        response = await self.client.post(
            f"{API_BASE_URL}/auth/login",
            data={"username": USERNAME, "password": PASSWORD}
        )
        response.raise_for_status()
        data = response.json()
        self.token = data["access_token"]
        print(f"✓ Logged in successfully")

    def get_headers(self):
        """Get headers with authentication token"""
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"
        return headers

    def generate_vehicle_number(self):
        """Generate a random vehicle number"""
        state = random.choice(STATES)
        letters = ''.join(random.choices('ABCDEFGHIJKLMNOPQRSTUVWXYZ', k=2))
        number = random.randint(1, 99)
        suffix = ''.join(random.choices('0123456789', k=4))
        return f"{state}-{number}-{letters}-{suffix}"

    async def seed_employees(self):
        """Generate and insert employee data"""
        print("\n📝 Seeding employees...")
        employees = []
        id_counter = 1001

        for category in CATEGORIES:
            count = CATEGORY_COUNTS[category]
            for i in range(count):
                first_name = random.choice(FIRST_NAMES)
                last_name = random.choice(LAST_NAMES)
                
                if category == 'Extra Labour':
                    emp_id = f"EXT{str(i + 1).zfill(3)}"
                else:
                    emp_id = str(id_counter).zfill(4)
                    id_counter += 1

                employee = {
                    "employeeId": emp_id,
                    "name": f"{first_name} {last_name}",
                    "category": category,
                    "status": "active",
                    "contractor": random.choice(CONTRACTORS),
                    "remarks": ""
                }
                employees.append(employee)

        # Insert employees
        for employee in employees:
            try:
                response = await self.client.post(
                    f"{API_BASE_URL}/employees",
                    json=employee,
                    headers=self.get_headers()
                )
                if response.status_code == 409:  # Conflict - employee exists
                    print(f"  - Employee {employee['employeeId']} already exists, skipping")
                else:
                    response.raise_for_status()
                    print(f"  ✓ Created employee: {employee['employeeId']} - {employee['name']}")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 409:
                    print(f"  - Employee {employee['employeeId']} already exists, skipping")
                else:
                    print(f"  ✗ Failed to create employee {employee['employeeId']}: {e}")

        print(f"✓ Seeded {len(employees)} employees")

    async def seed_vehicles(self):
        """Generate and insert vehicle data"""
        print("\n🚗 Seeding vehicles...")
        vehicles = []

        for i in range(1, 26):
            vehicle = {
                "vehicleNumber": self.generate_vehicle_number(),
                "vehicleType": random.choice(VEHICLE_TYPES),
                "status": random.choice(["available", "in_use", "maintenance"]),
                "active": True
            }
            vehicles.append(vehicle)

        # Insert vehicles
        for vehicle in vehicles:
            try:
                response = await self.client.post(
                    f"{API_BASE_URL}/vehicles",
                    json=vehicle,
                    headers=self.get_headers()
                )
                if response.status_code == 409:  # Conflict - vehicle exists
                    print(f"  - Vehicle {vehicle['vehicleNumber']} already exists, skipping")
                else:
                    response.raise_for_status()
                    print(f"  ✓ Created vehicle: {vehicle['vehicleNumber']} ({vehicle['vehicleType']})")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 409:
                    print(f"  - Vehicle {vehicle['vehicleNumber']} already exists, skipping")
                else:
                    print(f"  ✗ Failed to create vehicle {vehicle['vehicleNumber']}: {e}")

        print(f"✓ Seeded {len(vehicles)} vehicles")

    async def seed_sessions(self):
        """Generate and insert session data"""
        print("\n📅 Seeding sessions...")
        
        # Create sessions for the last 7 days
        today = datetime.now()
        sessions = []

        for days_ago in range(7):
            session_date = (today - timedelta(days=days_ago)).strftime("%Y-%m-%d")
            # Mark today's session as in_progress, past sessions as finalized
            session = {
                "sessionDate": session_date,
                "shift": random.choice(["morning", "evening"]),
                "supervisorId": "admin",
                "status": "in_progress" if days_ago == 0 else "finalized"
            }
            sessions.append(session)

        # Insert sessions
        for session in sessions:
            try:
                response = await self.client.post(
                    f"{API_BASE_URL}/sessions",
                    json=session,
                    headers=self.get_headers()
                )
                if response.status_code == 409:  # Conflict - session exists
                    print(f"  - Session {session['sessionDate']} already exists, skipping")
                else:
                    response.raise_for_status()
                    status = "✓" if session["status"] == "in_progress" else "✓"
                    print(f"  {status} Created session: {session['sessionDate']} ({session['shift']})")
            except httpx.HTTPStatusError as e:
                if e.response.status_code == 409:
                    print(f"  - Session {session['sessionDate']} already exists, skipping")
                else:
                    print(f"  ✗ Failed to create session {session['sessionDate']}: {e}")

        print(f"✓ Seeded {len(sessions)} sessions")

    async def seed_attendance(self):
        """Generate and insert attendance records for active session"""
        print("\n✅ Seeding attendance records...")
        
        # Try to get active session first
        response = await self.client.get(
            f"{API_BASE_URL}/sessions/active",
            headers=self.get_headers()
        )
        
        session_id = None
        if response.status_code == 200:
            active_session = response.json()
            session_id = active_session.get("id") or active_session.get("_id") or active_session.get("sessionId")
            print(f"  - Using active session: {session_id}")
        else:
            # If no active session, get the most recent session
            response = await self.client.get(
                f"{API_BASE_URL}/sessions",
                headers=self.get_headers()
            )
            if response.status_code == 200:
                sessions = response.json()
                if sessions and len(sessions) > 0:
                    # Get the most recent session (first one should be sorted by date)
                    session_id = sessions[0].get("id") or sessions[0].get("_id") or sessions[0].get("sessionId")
                    print(f"  - Using most recent session: {session_id}")
        
        if not session_id:
            print("  - No session found, skipping attendance")
            return

        # Get all employees
        response = await self.client.get(
            f"{API_BASE_URL}/employees",
            headers=self.get_headers()
        )
        response.raise_for_status()
        employees = response.json()

        # Generate random attendance for each employee
        attendance_statuses = ["on_time", "arrived", "absent"]
        attendance_count = 0

        for employee in employees:
            status = random.choice(attendance_statuses)
            arrival_time = None
            
            if status in ["on_time", "arrived"]:
                hour = random.randint(8, 10)
                minute = random.randint(0, 59)
                arrival_time = f"{hour:02d}:{minute:02d}"

            attendance_data = {
                "status": status,
                "arrivalTime": arrival_time,
                "remarks": ""
            }

            try:
                response = await self.client.put(
                    f"{API_BASE_URL}/attendance/sessions/{session_id}/employees/{employee['employeeId']}",
                    json=attendance_data,
                    headers=self.get_headers()
                )
                response.raise_for_status()
                attendance_count += 1
                print(f"  ✓ Recorded attendance for {employee['employeeId']}: {status}")
            except httpx.HTTPStatusError as e:
                print(f"  ✗ Failed to record attendance for {employee['employeeId']}: {e}")

        print(f"✓ Seeded {attendance_count} attendance records")

    async def close(self):
        """Close the HTTP client"""
        await self.client.aclose()

async def main():
    """Main seeding function"""
    print("🌱 Starting database seeding...")
    print("=" * 50)

    seeder = DataSeeder()

    try:
        await seeder.login()
        await seeder.seed_employees()
        await seeder.seed_vehicles()
        await seeder.seed_sessions()
        await seeder.seed_attendance()
        
        print("\n" + "=" * 50)
        print("✅ Database seeding completed successfully!")
    except Exception as e:
        print(f"\n❌ Error during seeding: {e}")
        raise
    finally:
        await seeder.close()

if __name__ == "__main__":
    asyncio.run(main())
