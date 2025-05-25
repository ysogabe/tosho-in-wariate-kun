import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiLibraries(unittest.TestCase):

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

    def test_get_all_libraries(self):
        """Test GET /api/libraries - retrieving all libraries."""
        response = self.app.get('/api/libraries')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        print("test_get_all_libraries: PASSED")

    def test_create_new_library(self):
        """Test POST /api/libraries - creating a new library."""
        new_library_payload = {
            "name": "Test Library",
            "location": "Test Location",
            "capacity": 50,
            "is_active": True
        }
        response = self.app.post('/api/libraries', 
                                 data=json.dumps(new_library_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_library_payload['name'])
        self.assertEqual(data['location'], new_library_payload['location'])
        self.assertEqual(data['capacity'], new_library_payload['capacity'])
        self.assertEqual(data['is_active'], new_library_payload['is_active'])
        
        print(f"test_create_new_library: PASSED (created library ID: {data['id']})")

    def test_create_library_missing_name(self):
        """Test POST /api/libraries - creating a library with missing name."""
        new_library_payload = {
            "location": "Test Location",
            "capacity": 50,
            "is_active": True
        }
        response = self.app.post('/api/libraries', 
                                 data=json.dumps(new_library_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        print("test_create_library_missing_name: PASSED")

    def test_get_specific_library(self):
        """Test GET /api/libraries/<id> - retrieving a specific library."""
        # First create a library
        library_payload = {
            "name": "Library For Get Test",
            "location": "Test Location",
            "capacity": 50,
            "is_active": True
        }
        post_response = self.app.post('/api/libraries', 
                                      data=json.dumps(library_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_library_id = json.loads(post_response.data)['id']

        # Now get the library
        response = self.app.get(f'/api/libraries/{created_library_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_library_id)
        self.assertEqual(data['name'], library_payload['name'])
        print(f"test_get_specific_library: PASSED (fetched library ID: {created_library_id})")

    def test_update_library(self):
        """Test PUT /api/libraries/<id> - updating an existing library."""
        # First create a library
        library_payload = {
            "name": "Library To Update",
            "location": "Original Location",
            "capacity": 50,
            "is_active": True
        }
        post_response = self.app.post('/api/libraries', 
                                      data=json.dumps(library_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_library_id = json.loads(post_response.data)['id']

        # Update the library
        update_payload = {
            "name": "Updated Library Name",
            "location": "Updated Location",
            "capacity": 75,
            "is_active": False
        }
        put_response = self.app.put(f'/api/libraries/{created_library_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_library_id)
        self.assertEqual(updated_data['name'], update_payload['name'])
        self.assertEqual(updated_data['location'], update_payload['location'])
        self.assertEqual(updated_data['capacity'], update_payload['capacity'])
        self.assertEqual(updated_data['is_active'], update_payload['is_active'])
        
        # Verify by getting the library again
        get_response = self.app.get(f'/api/libraries/{created_library_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['name'], update_payload['name'])
        print(f"test_update_library: PASSED (updated library ID: {created_library_id})")

    def test_delete_library(self):
        """Test DELETE /api/libraries/<id> - deleting a library."""
        # First create a library
        library_payload = {
            "name": "Library To Delete",
            "location": "Delete Location",
            "capacity": 30,
            "is_active": True
        }
        post_response = self.app.post('/api/libraries', 
                                      data=json.dumps(library_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_library_id = json.loads(post_response.data)['id']

        # Delete the library
        delete_response = self.app.delete(f'/api/libraries/{created_library_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted library
        get_response = self.app.get(f'/api/libraries/{created_library_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_library: PASSED (deleted library ID: {created_library_id})")

if __name__ == '__main__':
    unittest.main()
