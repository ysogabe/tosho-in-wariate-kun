import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiScheduleAssignments(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up for all tests in this class"""
        # Configure the app for testing
        app.config['TESTING'] = True
        app.config['DATABASE'] = DATABASE_PATH

        # Initialize a fresh database for testing
        if os.path.exists(DATABASE_PATH):
            os.remove(DATABASE_PATH)
        
        print(f"Initializing database at {DATABASE_PATH} for tests...")
        setup_database()
        seed_data()
        print("Database initialized and seeded for tests.")

    def setUp(self):
        """Set up for each test method."""
        self.app = app.test_client()

    @classmethod
    def tearDownClass(cls):
        """Clean up once after all tests in this class have run."""
        pass # Keep the database for inspection

    def test_add_schedule_assignment(self):
        """Test POST /api/schedule-assignments - creating a new schedule assignment."""
        # Get a valid schedule_id, library_id, and committee_member_id
        schedule_response = self.app.get('/api/schedules')
        schedules = json.loads(schedule_response.data)
        self.assertTrue(len(schedules) > 0, "No schedules found for test")
        schedule_id = schedules[0]['id']
        
        library_response = self.app.get('/api/libraries')
        libraries = json.loads(library_response.data)
        self.assertTrue(len(libraries) > 0, "No libraries found for test")
        library_id = libraries[0]['id']
        
        member_response = self.app.get('/api/committee-members')
        members = json.loads(member_response.data)
        self.assertTrue(len(members) > 0, "No committee members found for test")
        committee_member_ids = [members[0]['id'], members[1]['id']] if len(members) > 1 else [members[0]['id']]
        
        # Create a new assignment with multiple committee members
        new_assignment_payload = {
            "schedule_id": schedule_id,
            "library_id": library_id,
            "date": "2025-05-01",
            "time_slot": "10:00-11:00",
            "assigned_committee_member_ids": committee_member_ids
        }
        
        response = self.app.post('/api/schedule-assignments', 
                                 data=json.dumps(new_assignment_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['schedule_id'], new_assignment_payload['schedule_id'])
        self.assertEqual(data['library_id'], new_assignment_payload['library_id'])
        self.assertEqual(data['date'], new_assignment_payload['date'])
        self.assertEqual(data['time_slot'], new_assignment_payload['time_slot'])
        
        # Check if assigned committee members are included in response
        self.assertIn('assigned_committee_members', data)
        self.assertTrue(len(data['assigned_committee_members']) > 0)
        
        print(f"test_add_schedule_assignment: PASSED (created assignment ID: {data['id']})")

    def test_update_schedule_assignment(self):
        """Test PUT /api/schedule-assignments/<id> - updating an existing schedule assignment."""
        # First create a schedule assignment
        schedule_response = self.app.get('/api/schedules')
        schedules = json.loads(schedule_response.data)
        schedule_id = schedules[0]['id']
        
        library_response = self.app.get('/api/libraries')
        libraries = json.loads(library_response.data)
        library_id = libraries[0]['id']
        
        member_response = self.app.get('/api/committee-members')
        members = json.loads(member_response.data)
        committee_member_ids = [members[0]['id']]
        
        assignment_payload = {
            "schedule_id": schedule_id,
            "library_id": library_id,
            "date": "2025-06-01",
            "time_slot": "13:00-14:00",
            "committee_member_ids": committee_member_ids
        }
        
        post_response = self.app.post('/api/schedule-assignments', 
                                      data=json.dumps(assignment_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_assignment_id = json.loads(post_response.data)['id']

        # Update the assignment with new committee members
        new_committee_member_ids = [members[1]['id']] if len(members) > 1 else committee_member_ids
        update_payload = {
            "date": "2025-06-15",
            "time_slot": "14:00-15:00",
            "committee_member_ids": new_committee_member_ids
        }
        
        put_response = self.app.put(f'/api/schedule-assignments/{created_assignment_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_assignment_id)
        self.assertEqual(updated_data['date'], update_payload['date'])
        self.assertEqual(updated_data['time_slot'], update_payload['time_slot'])
        
        # Check if assigned committee members are updated
        self.assertIn('assigned_committee_members', updated_data)
        
        print(f"test_update_schedule_assignment: PASSED (updated assignment ID: {created_assignment_id})")

    def test_delete_schedule_assignment(self):
        """Test DELETE /api/schedule-assignments/<id> - deleting a schedule assignment."""
        # First create a schedule assignment
        schedule_response = self.app.get('/api/schedules')
        schedules = json.loads(schedule_response.data)
        schedule_id = schedules[0]['id']
        
        library_response = self.app.get('/api/libraries')
        libraries = json.loads(library_response.data)
        library_id = libraries[0]['id']
        
        member_response = self.app.get('/api/committee-members')
        members = json.loads(member_response.data)
        committee_member_ids = [members[0]['id']]
        
        assignment_payload = {
            "schedule_id": schedule_id,
            "library_id": library_id,
            "date": "2025-07-01",
            "time_slot": "15:00-16:00",
            "committee_member_ids": committee_member_ids
        }
        
        post_response = self.app.post('/api/schedule-assignments', 
                                      data=json.dumps(assignment_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_assignment_id = json.loads(post_response.data)['id']

        # Delete the assignment
        delete_response = self.app.delete(f'/api/schedule-assignments/{created_assignment_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        print(f"test_delete_schedule_assignment: PASSED (deleted assignment ID: {created_assignment_id})")

if __name__ == '__main__':
    unittest.main()
