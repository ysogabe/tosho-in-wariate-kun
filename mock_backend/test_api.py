import requests
import json

def test_api():
    """Test the API endpoints to verify they're working correctly."""
    base_url = "http://localhost:5001/api"
    
    print("Testing API endpoints...")
    
    # Test grades endpoint
    print("\n--- Testing Grades API ---")
    try:
        # Get all grades
        response = requests.get(f"{base_url}/grades")
        print(f"GET /grades: Status {response.status_code}")
        if response.status_code == 200:
            grades = response.json()
            print(f"Found {len(grades)} grades")
            for grade in grades[:3]:  # Show first 3 grades
                print(f"  - {grade['id']}: {grade['name']}")
        
        # Create a new grade
        new_grade = {"name": "Test Grade", "description": "Created by test script"}
        response = requests.post(f"{base_url}/grades", json=new_grade)
        print(f"POST /grades: Status {response.status_code}")
        if response.status_code == 201:
            created_grade = response.json()
            print(f"Created grade with ID {created_grade['id']}")
            
            # Update the grade
            update_data = {"name": "Updated Test Grade"}
            response = requests.put(f"{base_url}/grades/{created_grade['id']}", json=update_data)
            print(f"PUT /grades/{created_grade['id']}: Status {response.status_code}")
            
            # Delete the grade
            response = requests.delete(f"{base_url}/grades/{created_grade['id']}")
            print(f"DELETE /grades/{created_grade['id']}: Status {response.status_code}")
    except Exception as e:
        print(f"Error testing grades API: {e}")
    
    # Test classes endpoint
    print("\n--- Testing Classes API ---")
    try:
        response = requests.get(f"{base_url}/classes")
        print(f"GET /classes: Status {response.status_code}")
        if response.status_code == 200:
            classes = response.json()
            print(f"Found {len(classes)} classes")
            for class_item in classes[:3]:  # Show first 3 classes
                print(f"  - {class_item['id']}: {class_item['name']}")
    except Exception as e:
        print(f"Error testing classes API: {e}")
    
    # Test committee members endpoint
    print("\n--- Testing Committee Members API ---")
    try:
        response = requests.get(f"{base_url}/committee-members")
        print(f"GET /committee-members: Status {response.status_code}")
        if response.status_code == 200:
            members = response.json()
            print(f"Found {len(members)} committee members")
            for member in members[:3]:  # Show first 3 members
                print(f"  - {member['id']}: {member['name']}")
    except Exception as e:
        print(f"Error testing committee members API: {e}")
    
    # Test libraries endpoint
    print("\n--- Testing Libraries API ---")
    try:
        response = requests.get(f"{base_url}/libraries")
        print(f"GET /libraries: Status {response.status_code}")
        if response.status_code == 200:
            libraries = response.json()
            print(f"Found {len(libraries)} libraries")
            for library in libraries:
                print(f"  - {library['id']}: {library['name']}")
    except Exception as e:
        print(f"Error testing libraries API: {e}")
    
    # Test schedules endpoint
    print("\n--- Testing Schedules API ---")
    try:
        response = requests.get(f"{base_url}/schedules")
        print(f"GET /schedules: Status {response.status_code}")
        if response.status_code == 200:
            schedules = response.json()
            print(f"Found {len(schedules)} schedules")
            for schedule in schedules:
                print(f"  - {schedule['id']}: {schedule['name']}")
    except Exception as e:
        print(f"Error testing schedules API: {e}")

if __name__ == "__main__":
    test_api()
