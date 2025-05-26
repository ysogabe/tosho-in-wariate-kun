import unittest
import json
import sys
import os

# Adjust the Python path to include the parent directory (mock_backend)
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from app import app, DATABASE_PATH, get_db_connection
from db_setup import setup_database
from seed_data import seed_data

class TestApiPositions(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        """Set up for all tests in this class"""
        print("Setting up test environment for Positions API tests...")
        
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

    def test_get_all_positions(self):
        """Test GET /api/positions - retrieving all positions."""
        response = self.app.get('/api/positions')
        self.assertEqual(response.status_code, 200)
        data = json.loads(response.data)
        self.assertIsInstance(data, list)
        # Check if seeded data is present
        self.assertTrue(len(data) > 0)
        
        # Verify required fields
        for position in data:
            self.assertIn('id', position)
            self.assertIn('position_name', position)
            self.assertIn('description', position)
        
        print("test_get_all_positions: PASSED")

    def test_create_new_position(self):
        """Test POST /api/positions - creating a new position."""
        new_position_payload = {
            "position_name": "テスト委員長",
            "description": "テスト用の委員長ポジション"
        }
        response = self.app.post('/api/positions', 
                                 data=json.dumps(new_position_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['position_name'], new_position_payload['position_name'])
        self.assertEqual(data['description'], new_position_payload['description'])
        
        print(f"test_create_new_position: PASSED (created position ID: {data['id']})")

    def test_create_position_missing_name(self):
        """Test POST /api/positions - creating a position with missing name."""
        new_position_payload = {
            "description": "名前のないポジション"
        }
        response = self.app.post('/api/positions', 
                                 data=json.dumps(new_position_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 400)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Missing position_name in request body")
        print("test_create_position_missing_name: PASSED")

    def test_get_specific_position(self):
        """Test GET /api/positions/<id> - retrieving a specific position."""
        # First create a position
        new_position_payload = {
            "position_name": "特定テスト委員",
            "description": "特定取得テスト用ポジション"
        }
        post_response = self.app.post('/api/positions', 
                                      data=json.dumps(new_position_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_position_id = json.loads(post_response.data)['id']

        # Get the specific position
        get_response = self.app.get(f'/api/positions/{created_position_id}')
        self.assertEqual(get_response.status_code, 200)
        data = json.loads(get_response.data)
        self.assertEqual(data['id'], created_position_id)
        self.assertEqual(data['position_name'], new_position_payload['position_name'])
        self.assertEqual(data['description'], new_position_payload['description'])
        print(f"test_get_specific_position: PASSED (retrieved position ID: {created_position_id})")

    def test_get_non_existent_position(self):
        """Test GET /api/positions/<id> - retrieving a non-existent position."""
        response = self.app.get('/api/positions/99999')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Position not found")
        print("test_get_non_existent_position: PASSED")

    def test_update_position(self):
        """Test PUT /api/positions/<id> - updating an existing position."""
        # First create a position
        new_position_payload = {
            "position_name": "更新前委員",
            "description": "更新前の説明"
        }
        post_response = self.app.post('/api/positions', 
                                      data=json.dumps(new_position_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_position_id = json.loads(post_response.data)['id']

        # Update the position
        update_payload = {
            "position_name": "更新後委員",
            "description": "更新後の説明"
        }
        put_response = self.app.put(f'/api/positions/{created_position_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_position_id)
        self.assertEqual(updated_data['position_name'], update_payload['position_name'])
        self.assertEqual(updated_data['description'], update_payload['description'])
        
        # Verify by getting the position again
        get_response = self.app.get(f'/api/positions/{created_position_id}')
        self.assertEqual(get_response.status_code, 200)
        refetched_data = json.loads(get_response.data)
        self.assertEqual(refetched_data['position_name'], update_payload['position_name'])
        self.assertEqual(refetched_data['description'], update_payload['description'])
        print(f"test_update_position: PASSED (updated position ID: {created_position_id})")

    def test_delete_position(self):
        """Test DELETE /api/positions/<id> - deleting a position."""
        # First create a position
        new_position_payload = {
            "position_name": "削除予定委員",
            "description": "削除テスト用ポジション"
        }
        post_response = self.app.post('/api/positions', 
                                      data=json.dumps(new_position_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_position_id = json.loads(post_response.data)['id']

        # Delete the position
        delete_response = self.app.delete(f'/api/positions/{created_position_id}')
        self.assertEqual(delete_response.status_code, 200)
        
        # Try to get the deleted position
        get_response = self.app.get(f'/api/positions/{created_position_id}')
        self.assertEqual(get_response.status_code, 404)
        print(f"test_delete_position: PASSED (deleted position ID: {created_position_id})")

    def test_update_non_existent_position(self):
        """Test PUT /api/positions/<id> - updating a non-existent position."""
        update_payload = {
            "position_name": "存在しないポジション"
        }
        response = self.app.put('/api/positions/99999', 
                                data=json.dumps(update_payload), 
                                content_type='application/json')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Position not found")
        print("test_update_non_existent_position: PASSED")

    def test_delete_non_existent_position(self):
        """Test DELETE /api/positions/<id> - deleting a non-existent position."""
        response = self.app.delete('/api/positions/99999')
        self.assertEqual(response.status_code, 404)
        data = json.loads(response.data)
        self.assertIn('error', data)
        self.assertEqual(data['error'], "Position not found")
        print("test_delete_non_existent_position: PASSED")

    def test_create_position_with_empty_description(self):
        """Test POST /api/positions - creating a position with empty description."""
        new_position_payload = {
            "position_name": "説明なし委員"
        }
        response = self.app.post('/api/positions', 
                                 data=json.dumps(new_position_payload), 
                                 content_type='application/json')
        self.assertEqual(response.status_code, 201)
        data = json.loads(response.data)
        self.assertIn('id', data)
        self.assertEqual(data['position_name'], new_position_payload['position_name'])
        self.assertEqual(data['description'], '')  # Should default to empty string
        print(f"test_create_position_with_empty_description: PASSED (created position ID: {data['id']})")

    def test_partial_update_position(self):
        """Test PUT /api/positions/<id> - partial update of position."""
        # First create a position
        new_position_payload = {
            "position_name": "部分更新委員",
            "description": "元の説明"
        }
        post_response = self.app.post('/api/positions', 
                                      data=json.dumps(new_position_payload), 
                                      content_type='application/json')
        self.assertEqual(post_response.status_code, 201)
        created_position_id = json.loads(post_response.data)['id']

        # Update only the description
        update_payload = {
            "description": "新しい説明のみ"
        }
        put_response = self.app.put(f'/api/positions/{created_position_id}', 
                                    data=json.dumps(update_payload), 
                                    content_type='application/json')
        self.assertEqual(put_response.status_code, 200)
        updated_data = json.loads(put_response.data)
        self.assertEqual(updated_data['id'], created_position_id)
        self.assertEqual(updated_data['position_name'], new_position_payload['position_name'])  # Should remain unchanged
        self.assertEqual(updated_data['description'], update_payload['description'])
        
        print(f"test_partial_update_position: PASSED (partially updated position ID: {created_position_id})")

if __name__ == '__main__':
    unittest.main()
