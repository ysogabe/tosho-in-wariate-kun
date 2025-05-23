import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
# This allows importing 'app' from the 'mock_backend' directory
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiGrades(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up for all tests in this class"""
        # Configure the app for testing
        app.config['TESTING'] = True
        app.config['DATABASE'] = DATABASE_PATH # Ensure app uses the correct DB path

        # Initialize a fresh database for testing
        # Remove existing DB if it exists to ensure a clean state
        if os.path.exists(DATABASE_PATH):
            os.remove(DATABASE_PATH)
        
        print(f"Initializing database at {DATABASE_PATH} for tests...")
        setup_database()
        seed_data()
        print("Database initialized and seeded for tests.")

    def setUp(self):
        """Set up for each test method."""
        self.app = app.test_client()
        # self.app_context = app.app_context() # Create an app context
        # self.app_context.push() # Push it to make it current

        # We don't need to re-seed for every test if setUpClass does it once,
        # but if tests modify data and need a pristine state,
        # it might be better to re-seed or use transactions.
        # For now, we rely on setUpClass for initial setup.

    # def tearDown(self):
    #     """Clean up after each test method."""
    #     self.app_context.pop() # Pop the app context

    @classmethod
    def tearDownClass(cls):
        """Clean up once after all tests in this class have run."""
        # It's good practice to clean up the test database
        # if os.path.exists(DATABASE_PATH):
        #     os.remove(DATABASE_PATH)
        #     print(f"Test database {DATABASE_PATH} removed.")
        pass # Keep the database for inspection for now


    def test_get_all_grades(self):
        """Test GET /api/grades - retrieving all grades."""
        response = self.app.get('/api/grades')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present (at least 6 grades were seeded)
        self.assertTrue(len(data) >= 6) 
        print("test_get_all_grades: PASSED")

    def test_create_new_grade(self):
        """Test POST /api/grades - creating a new grade."""
        new_grade_payload = {
            "name": "7年生",
            "description": "中学1年生に相当"
        }
        response = self.app.post('/api/grades', 
                                 data=json.dumps(new_grade_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_grade_payload['name'])
        self.assertEqual(data['description'], new_grade_payload['description'])
        
        # Store the ID for potential use in other tests if needed, or cleanup
        self.created_grade_id_for_create_test = data['id']
        print(f"test_create_new_grade: PASSED (created grade ID: {data['id']})")

    def test_create_grade_missing_name(self):
        """Test POST /api/grades - creating a grade with missing name."""
        new_grade_payload = {
            "description": "A grade without a name"
        }
        response = self.app.post('/api/grades', 
                                 data=json.dumps(new_grade_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400) # Expecting Bad Request
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Missing name in request body")
        print("test_create_grade_missing_name: PASSED")

    def test_get_specific_grade(self):
        """Test GET /api/grades/<id> - retrieving a specific grade."""
        # First, create a grade to ensure it exists
        grade_payload = {"name": "Test Grade For Get", "description": "Fetch me"}
        post_response = self.app.post('/api/grades', data=json.dumps(grade_payload), content_type='application/json')
        self.assertEqual(post_response.status_code, 201, "Setup for get_specific_grade failed: could not create grade")
        created_grade_id = json.loads(post_response.data)['id']

        response = self.app.get(f'/api/grades/{created_grade_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_grade_id)
        self.assertEqual(data['name'], grade_payload['name'])
        print(f"test_get_specific_grade: PASSED (fetched grade ID: {created_grade_id})")

    def test_get_non_existent_grade(self):
        """Test GET /api/grades/<id> - retrieving a non-existent grade."""
        non_existent_id = 99999 
        # Verify this ID doesn't exist from seed data to be safe
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT 1 FROM grades WHERE id = ?", (non_existent_id,))
        self.assertIsNone(cursor.fetchone(), f"Grade with ID {non_existent_id} unexpectedly exists in DB.")
        conn.close()

        response = self.app.get(f'/api/grades/{non_existent_id}')
        self.assertEqual(response.status_code, 404) # Expecting Not Found
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Grade not found")
        print("test_get_non_existent_grade: PASSED")


    def test_update_grade(self):
        """Test PUT /api/grades/<id> - updating an existing grade."""
        # 1. Create a grade
        grade_payload = {"name": "Grade To Update", "description": "Original Desc"}
        post_response = self.app.post('/api/grades', data=json.dumps(grade_payload), content_type='application/json')
        self.assertEqual(post_response.status_code, 201, "Setup for update_grade failed: could not create grade")
        created_grade_id = json.loads(post_response.data)['id']

        # 2. Update the created grade
        update_payload = {"name": "Updated Grade Name", "description": "Updated Desc"}
        put_response = self.app.put(f'/api/grades/{created_grade_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_grade_id)
        self.assertEqual(updated_data['name'], update_payload['name'])
        self.assertEqual(updated_data['description'], update_payload['description'])

        # 3. Verify by GETting the grade again (optional, but good practice)
        get_response = self.app.get(f'/api/grades/{created_grade_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['name'], update_payload['name'])
        print(f"test_update_grade: PASSED (updated grade ID: {created_grade_id})")


    def test_delete_grade(self):
        """Test DELETE /api/grades/<id> - deleting a grade."""
        # 1. Create a grade to delete
        grade_payload = {"name": "Grade To Delete", "description": "Ephemeral"}
        post_response = self.app.post('/api/grades', data=json.dumps(grade_payload), content_type='application/json')
        self.assertEqual(post_response.status_code, 201, "Setup for delete_grade failed: could not create grade")
        created_grade_id = json.loads(post_response.data)['id']

        # 2. Delete the grade
        delete_response = self.app.delete(f'/api/grades/{created_grade_id}')
        self.assertEqual(delete_response.status_code, 200) # Or 204 if no content is returned
        delete_data = json.loads(delete_response.data)
        self.assertEqual(delete_data.get('message'), "Grade deleted successfully")


        # 3. Try to GET the deleted grade
        get_response = self.app.get(f'/api/grades/{created_grade_id}')
        self.assertEqual(get_response.status_code, 404) # Expecting Not Found
        print(f"test_delete_grade: PASSED (deleted grade ID: {created_grade_id})")

if __name__ == '__main__':
    # This allows running the tests directly from this file
    unittest.main()
