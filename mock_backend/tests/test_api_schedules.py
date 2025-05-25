import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiSchedules(unittest.TestCase):

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

    def test_get_all_schedules(self):
        """Test GET /api/schedules - retrieving all schedules."""
        response = self.app.get('/api/schedules')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        print("test_get_all_schedules: PASSED")

    def test_create_new_schedule(self):
        """Test POST /api/schedules - creating a new schedule."""
        new_schedule_payload = {
            "name": "Test Schedule",
            "description": "Test Description",
            "start_date": "2025-01-01",
            "end_date": "2025-01-31"
        }
        response = self.app.post('/api/schedules', 
                                 data=json.dumps(new_schedule_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_schedule_payload['name'])
        self.assertEqual(data['description'], new_schedule_payload['description'])
        self.assertEqual(data['start_date'], new_schedule_payload['start_date'])
        self.assertEqual(data['end_date'], new_schedule_payload['end_date'])
        
        print(f"test_create_new_schedule: PASSED (created schedule ID: {data['id']})")

    def test_create_schedule_missing_name(self):
        """Test POST /api/schedules - creating a schedule with missing name."""
        new_schedule_payload = {
            "description": "Test Description",
            "start_date": "2025-01-01",
            "end_date": "2025-01-31"
        }
        response = self.app.post('/api/schedules', 
                                 data=json.dumps(new_schedule_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        print("test_create_schedule_missing_name: PASSED")

    def test_get_specific_schedule(self):
        """Test GET /api/schedules/<id> - retrieving a specific schedule."""
        # First create a schedule
        schedule_payload = {
            "name": "Schedule For Get Test",
            "description": "Test Description",
            "start_date": "2025-02-01",
            "end_date": "2025-02-28"
        }
        post_response = self.app.post('/api/schedules', 
                                      data=json.dumps(schedule_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_schedule_id = json.loads(post_response.data)['id']

        # Now get the schedule
        response = self.app.get(f'/api/schedules/{created_schedule_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_schedule_id)
        self.assertEqual(data['name'], schedule_payload['name'])
        print(f"test_get_specific_schedule: PASSED (fetched schedule ID: {created_schedule_id})")

    def test_update_schedule(self):
        """Test PUT /api/schedules/<id> - updating an existing schedule."""
        # First create a schedule
        schedule_payload = {
            "name": "Schedule To Update",
            "description": "Original Description",
            "start_date": "2025-03-01",
            "end_date": "2025-03-31"
        }
        post_response = self.app.post('/api/schedules', 
                                      data=json.dumps(schedule_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_schedule_id = json.loads(post_response.data)['id']

        # Update the schedule
        update_payload = {
            "name": "Updated Schedule Name",
            "description": "Updated Description",
            "start_date": "2025-03-15",
            "end_date": "2025-04-15"
        }
        put_response = self.app.put(f'/api/schedules/{created_schedule_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_schedule_id)
        self.assertEqual(updated_data['name'], update_payload['name'])
        self.assertEqual(updated_data['description'], update_payload['description'])
        self.assertEqual(updated_data['start_date'], update_payload['start_date'])
        self.assertEqual(updated_data['end_date'], update_payload['end_date'])
        
        # Verify by getting the schedule again
        get_response = self.app.get(f'/api/schedules/{created_schedule_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['name'], update_payload['name'])
        print(f"test_update_schedule: PASSED (updated schedule ID: {created_schedule_id})")

    def test_delete_schedule(self):
        """Test DELETE /api/schedules/<id> - deleting a schedule."""
        # First create a schedule
        schedule_payload = {
            "name": "Schedule To Delete",
            "description": "Delete Description",
            "start_date": "2025-04-01",
            "end_date": "2025-04-30"
        }
        post_response = self.app.post('/api/schedules', 
                                      data=json.dumps(schedule_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_schedule_id = json.loads(post_response.data)['id']

        # Delete the schedule
        delete_response = self.app.delete(f'/api/schedules/{created_schedule_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted schedule
        get_response = self.app.get(f'/api/schedules/{created_schedule_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_schedule: PASSED (deleted schedule ID: {created_schedule_id})")

if __name__ == '__main__':
    unittest.main()
