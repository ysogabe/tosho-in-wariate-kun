import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiClasses(unittest.TestCase):

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

    def test_get_all_classes(self):
        """Test GET /api/classes - retrieving all classes."""
        response = self.app.get('/api/classes')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        print("test_get_all_classes: PASSED")

    def test_create_new_class(self):
        """Test POST /api/classes - creating a new class."""
        # First, get a valid grade_id from the database
        response = self.app.get('/api/grades')
        grades = json.loads(response.data)
        self.assertTrue(len(grades) > 0, "No grades found for test")
        grade_id = grades[0]['id']
        
        new_class_payload = {
            "name": "Test Class",
            "grade_id": grade_id
        }
        response = self.app.post('/api/classes', 
                                 data=json.dumps(new_class_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_class_payload['name'])
        self.assertEqual(data['grade_id'], new_class_payload['grade_id'])
        
        print(f"test_create_new_class: PASSED (created class ID: {data['id']})")

    def test_create_class_missing_name(self):
        """Test POST /api/classes - creating a class with missing name."""
        response = self.app.get('/api/grades')
        grades = json.loads(response.data)
        grade_id = grades[0]['id']
        
        new_class_payload = {
            "grade_id": grade_id
        }
        response = self.app.post('/api/classes', 
                                 data=json.dumps(new_class_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        print("test_create_class_missing_name: PASSED")

    def test_get_specific_class(self):
        """Test GET /api/classes/<id> - retrieving a specific class."""
        # First create a class
        response = self.app.get('/api/grades')
        grades = json.loads(response.data)
        grade_id = grades[0]['id']
        
        class_payload = {
            "name": "Class For Get Test",
            "grade_id": grade_id
        }
        post_response = self.app.post('/api/classes', 
                                      data=json.dumps(class_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_class_id = json.loads(post_response.data)['id']

        # Now get the class
        response = self.app.get(f'/api/classes/{created_class_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_class_id)
        self.assertEqual(data['name'], class_payload['name'])
        print(f"test_get_specific_class: PASSED (fetched class ID: {created_class_id})")

    def test_update_class(self):
        """Test PUT /api/classes/<id> - updating an existing class."""
        # First create a class
        response = self.app.get('/api/grades')
        grades = json.loads(response.data)
        grade_id = grades[0]['id']
        
        class_payload = {
            "name": "Class To Update",
            "grade_id": grade_id
        }
        post_response = self.app.post('/api/classes', 
                                      data=json.dumps(class_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_class_id = json.loads(post_response.data)['id']

        # Update the class
        update_payload = {
            "name": "Updated Class Name"
        }
        put_response = self.app.put(f'/api/classes/{created_class_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_class_id)
        self.assertEqual(updated_data['name'], update_payload['name'])
        
        # Verify by getting the class again
        get_response = self.app.get(f'/api/classes/{created_class_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['name'], update_payload['name'])
        print(f"test_update_class: PASSED (updated class ID: {created_class_id})")

    def test_delete_class(self):
        """Test DELETE /api/classes/<id> - deleting a class."""
        # First create a class
        response = self.app.get('/api/grades')
        grades = json.loads(response.data)
        grade_id = grades[0]['id']
        
        class_payload = {
            "name": "Class To Delete",
            "grade_id": grade_id
        }
        post_response = self.app.post('/api/classes', 
                                      data=json.dumps(class_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_class_id = json.loads(post_response.data)['id']

        # Delete the class
        delete_response = self.app.delete(f'/api/classes/{created_class_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted class
        get_response = self.app.get(f'/api/classes/{created_class_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_class: PASSED (deleted class ID: {created_class_id})")

if __name__ == '__main__':
    unittest.main()
