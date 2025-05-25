import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiCommitteeMembers(unittest.TestCase):

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

    def test_get_all_committee_members(self):
        """Test GET /api/committee-members - retrieving all committee members."""
        response = self.app.get('/api/committee-members')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        print("test_get_all_committee_members: PASSED")

    def test_create_new_committee_member(self):
        """Test POST /api/committee-members - creating a new committee member."""
        # First, get a valid class_id from the database
        response = self.app.get('/api/classes')
        classes = json.loads(response.data)
        self.assertTrue(len(classes) > 0, "No classes found for test")
        class_id = classes[0]['id']
        
        new_member_payload = {
            "name": "Test Member",
            "class_id": class_id,
            "role": "テスト委員"
        }
        response = self.app.post('/api/committee-members', 
                                 data=json.dumps(new_member_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['name'], new_member_payload['name'])
        self.assertEqual(data['class_id'], new_member_payload['class_id'])
        self.assertEqual(data['role'], new_member_payload['role'])
        
        print(f"test_create_new_committee_member: PASSED (created member ID: {data['id']})")

    def test_create_committee_member_missing_name(self):
        """Test POST /api/committee-members - creating a member with missing name."""
        response = self.app.get('/api/classes')
        classes = json.loads(response.data)
        class_id = classes[0]['id']
        
        new_member_payload = {
            "class_id": class_id,
            "role": "テスト委員"
        }
        response = self.app.post('/api/committee-members', 
                                 data=json.dumps(new_member_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        print("test_create_committee_member_missing_name: PASSED")

    def test_get_specific_committee_member(self):
        """Test GET /api/committee-members/<id> - retrieving a specific committee member."""
        # First create a committee member
        response = self.app.get('/api/classes')
        classes = json.loads(response.data)
        class_id = classes[0]['id']
        
        member_payload = {
            "name": "Member For Get Test",
            "class_id": class_id,
            "role": "テスト委員"
        }
        post_response = self.app.post('/api/committee-members', 
                                      data=json.dumps(member_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_member_id = json.loads(post_response.data)['id']

        # Now get the committee member
        response = self.app.get(f'/api/committee-members/{created_member_id}')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertEqual(data['id'], created_member_id)
        self.assertEqual(data['name'], member_payload['name'])
        print(f"test_get_specific_committee_member: PASSED (fetched member ID: {created_member_id})")

    def test_update_committee_member(self):
        """Test PUT /api/committee-members/<id> - updating an existing committee member."""
        # First create a committee member
        response = self.app.get('/api/classes')
        classes = json.loads(response.data)
        class_id = classes[0]['id']
        
        member_payload = {
            "name": "Member To Update",
            "class_id": class_id,
            "role": "元委員"
        }
        post_response = self.app.post('/api/committee-members', 
                                      data=json.dumps(member_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_member_id = json.loads(post_response.data)['id']

        # Update the committee member
        update_payload = {
            "name": "Updated Member Name",
            "role": "新委員長"
        }
        put_response = self.app.put(f'/api/committee-members/{created_member_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_member_id)
        self.assertEqual(updated_data['name'], update_payload['name'])
        self.assertEqual(updated_data['role'], update_payload['role'])
        
        # Verify by getting the committee member again
        get_response = self.app.get(f'/api/committee-members/{created_member_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['name'], update_payload['name'])
        print(f"test_update_committee_member: PASSED (updated member ID: {created_member_id})")

    def test_delete_committee_member(self):
        """Test DELETE /api/committee-members/<id> - deleting a committee member."""
        # First create a committee member
        response = self.app.get('/api/classes')
        classes = json.loads(response.data)
        class_id = classes[0]['id']
        
        member_payload = {
            "name": "Member To Delete",
            "class_id": class_id,
            "role": "削除対象"
        }
        post_response = self.app.post('/api/committee-members', 
                                      data=json.dumps(member_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_member_id = json.loads(post_response.data)['id']

        # Delete the committee member
        delete_response = self.app.delete(f'/api/committee-members/{created_member_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted committee member
        get_response = self.app.get(f'/api/committee-members/{created_member_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_committee_member: PASSED (deleted member ID: {created_member_id})")

if __name__ == '__main__':
    unittest.main()
