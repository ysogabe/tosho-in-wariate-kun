import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiSchools(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up for all tests in this class"""
        print("Setting up test environment for Schools API tests...")
        
        # Initialize database and seed data
        setup_database()
        seed_data()
        
        print("Test setup complete!")

    def setUp(self):
        """Set up for each test method."""
        self.app = app.test_client()

    @classmethod
    def tearDownClass(cls):
        """Clean up once after all tests in this class have run."""
        # Keep the database for inspection for now
        pass

    def test_get_all_schools(self):
        """Test GET /api/schools - retrieving all schools."""
        response = self.app.get('/api/schools')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        
        # Verify required fields
        for school in data:
            self.assertIn('id', school)
            self.assertIn('school_name', school)
            self.assertIn('active', school)
            self.assertTrue(school['active'])
        
        print("test_get_all_schools: PASSED")

    def test_create_new_school(self):
        """Test POST /api/schools - creating a new school."""
        new_school_payload = {
            "school_name": "テスト中学校",
            "first_term_start": "2025-04-01",
            "first_term_end": "2025-09-30",
            "second_term_start": "2025-10-01",
            "second_term_end": "2026-03-31"
        }
        response = self.app.post('/api/schools', 
                                 data=json.dumps(new_school_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['school_name'], new_school_payload['school_name'])
        self.assertEqual(data['first_term_start'], new_school_payload['first_term_start'])
        self.assertEqual(data['first_term_end'], new_school_payload['first_term_end'])
        self.assertEqual(data['second_term_start'], new_school_payload['second_term_start'])
        self.assertEqual(data['second_term_end'], new_school_payload['second_term_end'])
        self.assertTrue(data['active'])
        
        print(f"test_create_new_school: PASSED (created school ID: {data['id']})")

    def test_create_school_missing_name(self):
        """Test POST /api/schools - creating a school with missing name."""
        new_school_payload = {
            "first_term_start": "2025-04-01",
            "first_term_end": "2025-09-30"
        }
        response = self.app.post('/api/schools', 
                                 data=json.dumps(new_school_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Missing school_name in request body")
        print("test_create_school_missing_name: PASSED")

    def test_get_specific_school(self):
        """Test GET /api/schools/<id> - retrieving a specific school."""
        # First create a school
        new_school_payload = {
            "school_name": "テスト特定中学校",
            "first_term_start": "2025-04-01",
            "first_term_end": "2025-09-30"
        }
        post_response = self.app.post('/api/schools', 
                                      data=json.dumps(new_school_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_school_id = json.loads(post_response.data)['id']

        # Get the specific school
        get_response = self.app.get(f'/api/schools/{created_school_id}')
        self.assertEqual(get_response.status_code, 200)
        data = json.loads(get_response.data)
        self.assertEqual(data['id'], created_school_id)
        self.assertEqual(data['school_name'], new_school_payload['school_name'])
        print(f"test_get_specific_school: PASSED (retrieved school ID: {created_school_id})")

    def test_get_non_existent_school(self):
        """Test GET /api/schools/<id> - retrieving a non-existent school."""
        response = self.app.get('/api/schools/99999')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "School not found")
        print("test_get_non_existent_school: PASSED")

    def test_update_school(self):
        """Test PUT /api/schools/<id> - updating an existing school."""
        # First create a school
        new_school_payload = {
            "school_name": "更新前中学校",
            "first_term_start": "2025-04-01",
            "first_term_end": "2025-09-30"
        }
        post_response = self.app.post('/api/schools', 
                                      data=json.dumps(new_school_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_school_id = json.loads(post_response.data)['id']

        # Update the school
        update_payload = {
            "school_name": "更新後中学校",
            "second_term_start": "2025-10-05"
        }
        put_response = self.app.put(f'/api/schools/{created_school_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_school_id)
        self.assertEqual(updated_data['school_name'], update_payload['school_name'])
        self.assertEqual(updated_data['second_term_start'], update_payload['second_term_start'])
        
        # Verify by getting the school again
        get_response = self.app.get(f'/api/schools/{created_school_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['school_name'], update_payload['school_name'])
        print(f"test_update_school: PASSED (updated school ID: {created_school_id})")

    def test_delete_school(self):
        """Test DELETE /api/schools/<id> - deleting a school."""
        # First create a school
        new_school_payload = {
            "school_name": "削除予定中学校",
            "first_term_start": "2025-04-01",
            "first_term_end": "2025-09-30"
        }
        post_response = self.app.post('/api/schools', 
                                      data=json.dumps(new_school_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_school_id = json.loads(post_response.data)['id']

        # Delete the school
        delete_response = self.app.delete(f'/api/schools/{created_school_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted school
        get_response = self.app.get(f'/api/schools/{created_school_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_school: PASSED (deleted school ID: {created_school_id})")

    def test_update_non_existent_school(self):
        """Test PUT /api/schools/<id> - updating a non-existent school."""
        update_payload = {
            "school_name": "存在しない学校"
        }
        response = self.app.put('/api/schools/99999', 
                                data=json.dumps(update_payload), 
                                content_type='application/json')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "School not found")
        print("test_update_non_existent_school: PASSED")

    def test_delete_non_existent_school(self):
        """Test DELETE /api/schools/<id> - deleting a non-existent school."""
        response = self.app.delete('/api/schools/99999')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "School not found")
        print("test_delete_non_existent_school: PASSED")

if __name__ == '__main__':
    unittest.main()
