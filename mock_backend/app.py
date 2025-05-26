from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Logging Middleware ---
import logging
logging.basicConfig(level=logging.INFO, format='[MOCK_BACKEND LOG] %(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger("mock_backend")

# --- Import Schedule Generator ---
try:
    from schedule_generator import ScheduleGenerator, get_schedule_stats, generate_schedule_with_class
except ImportError:
    logger.warning("Schedule generator not available")

@app.before_request
def log_request_info():
    logger.info(f"{request.method} {request.path}")
    if request.method in ['POST', 'PUT', 'PATCH']:
        logger.info(f"Body: {request.get_data(as_text=True)}")

import sqlite3
from flask import request, jsonify

# --- Database Helper Functions ---
import os
DATABASE_PATH = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'database.db')

def get_db_connection():
    conn = sqlite3.connect(DATABASE_PATH)
    conn.row_factory = sqlite3.Row # Allows accessing columns by name
    return conn

# --- API Endpoints for Schools ---

@app.route('/api/schools', methods=['GET'])
def get_schools():
    conn = get_db_connection()
    schools_cursor = conn.execute('SELECT * FROM schools WHERE active = TRUE ORDER BY created_at DESC')
    schools = [dict(row) for row in schools_cursor.fetchall()]
    conn.close()
    return jsonify(schools)

@app.route('/api/schools/<int:school_id>', methods=['GET'])
def get_school(school_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM schools WHERE id = ? AND active = TRUE', (school_id,))
    school = cursor.fetchone()
    conn.close()
    
    if school is None:
        return jsonify({"error": "School not found"}), 404
        
    return jsonify(dict(school))

@app.route('/api/schools', methods=['POST'])
def add_school():
    new_school_data = request.json
    if not new_school_data or 'school_name' not in new_school_data:
        return jsonify({"error": "Missing school_name in request body"}), 400

    school_name = new_school_data['school_name']
    first_term_start = new_school_data.get('first_term_start')
    first_term_end = new_school_data.get('first_term_end')
    second_term_start = new_school_data.get('second_term_start')
    second_term_end = new_school_data.get('second_term_end')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('''
            INSERT INTO schools (school_name, first_term_start, first_term_end, second_term_start, second_term_end) 
            VALUES (?, ?, ?, ?, ?)
        ''', (school_name, first_term_start, first_term_end, second_term_start, second_term_end))
        conn.commit()
        new_school_id = cursor.lastrowid
        created_school = {
            "id": new_school_id, 
            "school_name": school_name,
            "first_term_start": first_term_start,
            "first_term_end": first_term_end,
            "second_term_start": second_term_start,
            "second_term_end": second_term_end,
            "active": True
        }
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Failed to create school, possibly due to constraint violation"}), 409
    finally:
        conn.close()

    return jsonify(created_school), 201

@app.route('/api/schools/<int:school_id>', methods=['PUT'])
def update_school(school_id):
    update_data = request.json
    if not update_data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if school exists
    cursor.execute('SELECT * FROM schools WHERE id = ?', (school_id,))
    school = cursor.fetchone()
    if not school:
        conn.close()
        return jsonify({"error": "School not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    for field in ['school_name', 'first_term_start', 'first_term_end', 'second_term_start', 'second_term_end', 'active']:
        if field in update_data:
            update_fields.append(f"{field} = ?")
            params.append(update_data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(school_id)

    try:
        cursor.execute(f'UPDATE schools SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    # Fetch the updated school to return
    return get_school(school_id)

@app.route('/api/schools/<int:school_id>', methods=['DELETE'])
def delete_school(school_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if school exists
    cursor.execute('SELECT * FROM schools WHERE id = ?', (school_id,))
    school = cursor.fetchone()
    if not school:
        conn.close()
        return jsonify({"error": "School not found"}), 404

    try:
        # Check for dependencies
        cursor.execute('SELECT 1 FROM classes WHERE school_id = ?', (school_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete school with associated classes. Please remove classes first."}), 409

        cursor.execute('DELETE FROM schools WHERE id = ?', (school_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "School deleted successfully"}), 200

# --- API Endpoints for Positions ---

@app.route('/api/positions', methods=['GET'])
def get_positions():
    conn = get_db_connection()
    positions_cursor = conn.execute('SELECT * FROM positions ORDER BY created_at DESC')
    positions = [dict(row) for row in positions_cursor.fetchall()]
    conn.close()
    return jsonify(positions)

@app.route('/api/positions/<int:position_id>', methods=['GET'])
def get_position(position_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM positions WHERE id = ?', (position_id,))
    position = cursor.fetchone()
    conn.close()
    
    if position is None:
        return jsonify({"error": "Position not found"}), 404
        
    return jsonify(dict(position))

@app.route('/api/positions', methods=['POST'])
def add_position():
    new_position_data = request.json
    if not new_position_data or 'position_name' not in new_position_data:
        return jsonify({"error": "Missing position_name in request body"}), 400

    position_name = new_position_data['position_name']
    description = new_position_data.get('description', '')

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO positions (position_name, description) VALUES (?, ?)', (position_name, description))
        conn.commit()
        new_position_id = cursor.lastrowid
        created_position = {"id": new_position_id, "position_name": position_name, "description": description}
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Failed to create position, possibly due to constraint violation"}), 409
    finally:
        conn.close()

    return jsonify(created_position), 201

@app.route('/api/positions/<int:position_id>', methods=['PUT'])
def update_position(position_id):
    update_data = request.json
    if not update_data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if position exists
    cursor.execute('SELECT * FROM positions WHERE id = ?', (position_id,))
    position = cursor.fetchone()
    if not position:
        conn.close()
        return jsonify({"error": "Position not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    for field in ['position_name', 'description']:
        if field in update_data:
            update_fields.append(f"{field} = ?")
            params.append(update_data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(position_id)

    try:
        cursor.execute(f'UPDATE positions SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return get_position(position_id)

@app.route('/api/positions/<int:position_id>', methods=['DELETE'])
def delete_position(position_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if position exists
    cursor.execute('SELECT * FROM positions WHERE id = ?', (position_id,))
    position = cursor.fetchone()
    if not position:
        conn.close()
        return jsonify({"error": "Position not found"}), 404

    try:
        # Check for dependencies
        cursor.execute('SELECT 1 FROM committee_members WHERE position_id = ?', (position_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete position with associated committee members. Please update members first."}), 409

        cursor.execute('DELETE FROM positions WHERE id = ?', (position_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Position deleted successfully"}), 200

# --- API Endpoints for Classes ---

@app.route('/api/classes', methods=['GET'])
def get_classes():
    conn = get_db_connection()
    # Join with schools to include school information
    query = """
    SELECT c.id, c.class_name as name, c.grade, c.class_number, c.school_id, 
           c.homeroom_teacher, c.active, s.school_name
    FROM classes c
    JOIN schools s ON c.school_id = s.id
    WHERE c.active = TRUE
    ORDER BY c.grade, c.class_number
    """
    classes_cursor = conn.execute(query)
    classes = [dict(row) for row in classes_cursor.fetchall()]
    
    # Add grade_id for frontend compatibility
    for class_item in classes:
        class_item['grade_id'] = class_item['grade']
    
    conn.close()
    return jsonify(classes)

@app.route('/api/classes', methods=['POST'])
def add_class():
    new_class_data = request.json
    if not new_class_data or 'name' not in new_class_data:
        return jsonify({"error": "Missing name in request body"}), 400

    name = new_class_data['name']
    grade = new_class_data.get('grade', new_class_data.get('grade_id', 5))  # Default to grade 5
    school_id = new_class_data.get('school_id')
    homeroom_teacher = new_class_data.get('homeroom_teacher', '')

    # Get the first school if school_id not provided
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if not school_id:
        cursor.execute('SELECT id FROM schools WHERE active = TRUE LIMIT 1')
        school_result = cursor.fetchone()
        if not school_result:
            conn.close()
            return jsonify({"error": "No active school found"}), 404
        school_id = school_result['id']

    # Parse class name to extract grade and class_number
    import re
    class_match = re.match(r'(\d+)([A-Z])', name)
    if class_match:
        grade = int(class_match.group(1))
        class_letter = class_match.group(2)
        class_number = ord(class_letter) - ord('A') + 1
    else:
        class_number = 1

    try:
        cursor.execute('''
            INSERT INTO classes (school_id, grade, class_number, class_name, homeroom_teacher) 
            VALUES (?, ?, ?, ?, ?)
        ''', (school_id, grade, class_number, name, homeroom_teacher))
        conn.commit()
        new_class_id = cursor.lastrowid
        
        # Fetch the school name for the response
        school_name = cursor.execute('SELECT school_name FROM schools WHERE id = ?', (school_id,)).fetchone()['school_name']
        created_class = {
            "id": new_class_id, 
            "name": name,
            "grade": grade,
            "grade_id": grade,  # For frontend compatibility
            "class_number": class_number,
            "school_id": school_id,
            "school_name": school_name,
            "homeroom_teacher": homeroom_teacher,
            "active": True
        }
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create class: {e}"}), 409
    finally:
        conn.close()

    return jsonify(created_class), 201

@app.route('/api/classes/<int:class_id>', methods=['GET'])
def get_class(class_id):
    conn = get_db_connection()
    query = """
    SELECT c.id, c.class_name as name, c.grade, c.class_number, c.school_id,
           c.homeroom_teacher, c.active, s.school_name
    FROM classes c
    JOIN schools s ON c.school_id = s.id
    WHERE c.id = ?
    """
    class_cursor = conn.execute(query, (class_id,))
    class_record = class_cursor.fetchone()
    conn.close()

    if not class_record:
        return jsonify({"error": "Class not found"}), 404
    
    class_dict = dict(class_record)
    class_dict['grade_id'] = class_dict['grade']  # For frontend compatibility
    return jsonify(class_dict)

@app.route('/api/classes/<int:class_id>', methods=['PUT'])
def update_class(class_id):
    update_data = request.json
    if not update_data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if class exists
    cursor.execute('SELECT * FROM classes WHERE id = ?', (class_id,))
    class_record = cursor.fetchone()
    if not class_record:
        conn.close()
        return jsonify({"error": "Class not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    
    if 'name' in update_data:
        update_fields.append("class_name = ?")
        params.append(update_data['name'])
    
    if 'grade' in update_data or 'grade_id' in update_data:
        grade = update_data.get('grade', update_data.get('grade_id'))
        update_fields.append("grade = ?")
        params.append(grade)
    
    for field in ['class_number', 'school_id', 'homeroom_teacher', 'active']:
        if field in update_data:
            update_fields.append(f"{field} = ?")
            params.append(update_data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(class_id)

    try:
        cursor.execute(f'UPDATE classes SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return get_class(class_id)

@app.route('/api/classes/<int:class_id>', methods=['DELETE'])
def delete_class(class_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if class exists
    cursor.execute('SELECT * FROM classes WHERE id = ?', (class_id,))
    class_record = cursor.fetchone()
    if not class_record:
        conn.close()
        return jsonify({"error": "Class not found"}), 404

    try:
        # Check for dependencies
        cursor.execute('SELECT 1 FROM committee_members WHERE class_id = ?', (class_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete class with associated committee members. Please remove members first."}), 409

        cursor.execute('DELETE FROM classes WHERE id = ?', (class_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Class deleted successfully"}), 200

# --- API Endpoints for Committee Members ---

@app.route('/api/committee-members', methods=['GET'])
def get_committee_members():
    conn = get_db_connection()
    query = """
    SELECT cm.id, cm.name, cm.student_id, cm.academic_year, cm.active, cm.class_id, 
           c.class_name as class_name, c.grade, s.school_name,
           p.position_name as role, cm.position_id
    FROM committee_members cm
    JOIN classes c ON cm.class_id = c.id
    JOIN schools s ON cm.school_id = s.id
    LEFT JOIN positions p ON cm.position_id = p.id
    WHERE cm.active = TRUE
    ORDER BY c.grade, c.class_number, cm.name
    """
    members_cursor = conn.execute(query)
    members = [dict(row) for row in members_cursor.fetchall()]
    
    # Add grade_id for frontend compatibility
    for member in members:
        member['grade_id'] = member['grade']
        member['grade_name'] = f"{member['grade']}年"
    
    conn.close()
    return jsonify(members)

@app.route('/api/committee-members', methods=['POST'])
def add_committee_member():
    data = request.json
    if not data or not data.get('name') or not data.get('class_id'):
        return jsonify({"error": "Missing name or class_id"}), 400

    name = data['name']
    class_id = data['class_id']
    student_id = data.get('student_id', f"S{class_id:03d}{len(name):02d}")
    academic_year = data.get('academic_year', 2025)
    position_id = data.get('position_id')
    role = data.get('role')  # For backward compatibility

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if class_id exists and get school_id
    cursor.execute('SELECT school_id FROM classes WHERE id = ?', (class_id,))
    class_result = cursor.fetchone()
    if not class_result:
        conn.close()
        return jsonify({"error": f"Class with id {class_id} not found"}), 404

    school_id = class_result['school_id']

    # If role is provided but position_id is not, try to find matching position
    if role and not position_id:
        cursor.execute('SELECT id FROM positions WHERE position_name = ?', (role,))
        position_result = cursor.fetchone()
        if position_result:
            position_id = position_result['id']

    try:
        cursor.execute('''
            INSERT INTO committee_members (school_id, student_id, name, class_id, position_id, academic_year)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (school_id, student_id, name, class_id, position_id, academic_year))
        conn.commit()
        new_member_id = cursor.lastrowid

        # Fetch related info for the response
        query = """
        SELECT cm.id, cm.name, cm.student_id, cm.academic_year, cm.active, cm.class_id,
               c.class_name as class_name, c.grade, s.school_name,
               p.position_name as role, cm.position_id
        FROM committee_members cm
        JOIN classes c ON cm.class_id = c.id
        JOIN schools s ON cm.school_id = s.id
        LEFT JOIN positions p ON cm.position_id = p.id
        WHERE cm.id = ?
        """
        new_member_details_cursor = conn.execute(query, (new_member_id,))
        created_member = dict(new_member_details_cursor.fetchone())
        created_member['grade_id'] = created_member['grade']
        created_member['grade_name'] = f"{created_member['grade']}年"

    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create committee member: {e}"}), 409
    finally:
        conn.close()

    return jsonify(created_member), 201

@app.route('/api/committee-members/<int:member_id>', methods=['GET'])
def get_committee_member(member_id):
    conn = get_db_connection()
    query = """
    SELECT cm.id, cm.name, cm.student_id, cm.academic_year, cm.active, cm.class_id,
           c.class_name as class_name, c.grade, s.school_name,
           p.position_name as role, cm.position_id
    FROM committee_members cm
    JOIN classes c ON cm.class_id = c.id
    JOIN schools s ON cm.school_id = s.id
    LEFT JOIN positions p ON cm.position_id = p.id
    WHERE cm.id = ?
    """
    member_cursor = conn.execute(query, (member_id,))
    member = member_cursor.fetchone()
    conn.close()

    if not member:
        return jsonify({"error": "Committee member not found"}), 404
    
    member_dict = dict(member)
    member_dict['grade_id'] = member_dict['grade']
    member_dict['grade_name'] = f"{member_dict['grade']}年"
    return jsonify(member_dict)

@app.route('/api/committee-members/<int:member_id>', methods=['PUT'])
def update_committee_member(member_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if member exists
    cursor.execute('SELECT * FROM committee_members WHERE id = ?', (member_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Committee member not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    
    for field in ['name', 'student_id', 'academic_year', 'active', 'position_id']:
        if field in data:
            update_fields.append(f"{field} = ?")
            params.append(data[field])
    
    # Handle role for backward compatibility
    if 'role' in data and 'position_id' not in data:
        role = data['role']
        position_result = cursor.execute('SELECT id FROM positions WHERE position_name = ?', (role,)).fetchone()
        if position_result:
            update_fields.append("position_id = ?")
            params.append(position_result['id'])
    
    # Handle class_id change (need to update school_id too)
    if 'class_id' in data:
        class_id = data['class_id']
        class_result = cursor.execute('SELECT school_id FROM classes WHERE id = ?', (class_id,)).fetchone()
        if not class_result:
            conn.close()
            return jsonify({"error": f"Class with id {class_id} not found"}), 404
        
        update_fields.append("class_id = ?")
        params.append(class_id)
        update_fields.append("school_id = ?")
        params.append(class_result['school_id'])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(member_id)

    try:
        cursor.execute(f'UPDATE committee_members SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return get_committee_member(member_id)

@app.route('/api/committee-members/<int:member_id>', methods=['DELETE'])
def delete_committee_member(member_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if member exists
    cursor.execute('SELECT * FROM committee_members WHERE id = ?', (member_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Committee member not found"}), 404

    try:
        # Check for dependencies
        cursor.execute('SELECT 1 FROM schedule_assignments WHERE committee_member_id = ?', (member_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete member with schedule assignments. Please update assignments first."}), 409

        cursor.execute('DELETE FROM committee_members WHERE id = ?', (member_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Committee member deleted successfully"}), 200

# --- API Endpoints for Library Rooms (renamed from Libraries) ---

@app.route('/api/library-rooms', methods=['GET'])
def get_library_rooms():
    conn = get_db_connection()
    query = """
    SELECT lr.id, lr.room_name as name, lr.room_id, lr.capacity, lr.description, 
           lr.active as is_active, lr.school_id, s.school_name
    FROM library_rooms lr
    JOIN schools s ON lr.school_id = s.id
    WHERE lr.active = TRUE
    ORDER BY lr.room_id
    """
    rooms_cursor = conn.execute(query)
    rooms = [dict(row) for row in rooms_cursor.fetchall()]
    conn.close()
    return jsonify(rooms)

# Backward compatibility endpoint
@app.route('/api/libraries', methods=['GET'])
def get_libraries():
    return get_library_rooms()

@app.route('/api/library-rooms', methods=['POST'])
def add_library_room():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"error": "Missing name for library room"}), 400

    name = data['name']
    room_id = data.get('room_id', 1)
    capacity = data.get('capacity', 1)
    description = data.get('description', '')
    school_id = data.get('school_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the first school if school_id not provided
    if not school_id:
        cursor.execute('SELECT id FROM schools WHERE active = TRUE LIMIT 1')
        school_result = cursor.fetchone()
        if not school_result:
            conn.close()
            return jsonify({"error": "No active school found"}), 404
        school_id = school_result['id']

    try:
        cursor.execute('''
            INSERT INTO library_rooms (school_id, room_id, room_name, capacity, description)
            VALUES (?, ?, ?, ?, ?)
        ''', (school_id, room_id, name, capacity, description))
        conn.commit()
        new_room_id = cursor.lastrowid

        # Fetch the created room with school info
        query = """
        SELECT lr.id, lr.room_name as name, lr.room_id, lr.capacity, lr.description,
               lr.active as is_active, lr.school_id, s.school_name
        FROM library_rooms lr
        JOIN schools s ON lr.school_id = s.id
        WHERE lr.id = ?
        """
        created_room_cursor = conn.execute(query, (new_room_id,))
        created_room = dict(created_room_cursor.fetchone())

    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create library room: {e}"}), 409
    finally:
        conn.close()

    return jsonify(created_room), 201

@app.route('/api/library-rooms/<int:room_id>', methods=['GET'])
def get_library_room(room_id):
    conn = get_db_connection()
    query = """
    SELECT lr.id, lr.room_name as name, lr.room_id, lr.capacity, lr.description,
           lr.active as is_active, lr.school_id, s.school_name
    FROM library_rooms lr
    JOIN schools s ON lr.school_id = s.id
    WHERE lr.id = ?
    """
    room_cursor = conn.execute(query, (room_id,))
    room = room_cursor.fetchone()
    conn.close()

    if not room:
        return jsonify({"error": "Library room not found"}), 404
    return jsonify(dict(room))

@app.route('/api/library-rooms/<int:room_id>', methods=['PUT'])
def update_library_room(room_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if room exists
    cursor.execute('SELECT * FROM library_rooms WHERE id = ?', (room_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Library room not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    
    field_mapping = {
        'name': 'room_name',
        'room_id': 'room_id',
        'capacity': 'capacity',
        'description': 'description',
        'is_active': 'active',
        'school_id': 'school_id'
    }
    
    for field, db_field in field_mapping.items():
        if field in data:
            update_fields.append(f"{db_field} = ?")
            params.append(data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(room_id)

    try:
        cursor.execute(f'UPDATE library_rooms SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return get_library_room(room_id)

@app.route('/api/library-rooms/<int:room_id>', methods=['DELETE'])
def delete_library_room(room_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if room exists
    cursor.execute('SELECT * FROM library_rooms WHERE id = ?', (room_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Library room not found"}), 404

    try:
        # Check for dependencies
        cursor.execute('SELECT 1 FROM schedule_assignments WHERE library_room_id = ?', (room_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete library room with associated schedule assignments."}), 409

        cursor.execute('DELETE FROM library_rooms WHERE id = ?', (room_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Library room deleted successfully"}), 200

# --- API Endpoints for Schedules ---

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    conn = get_db_connection()
    query = """
    SELECT s.id, s.schedule_name as name, s.description, s.academic_year, 
           s.is_first_half, s.status, s.school_id, sc.school_name,
           s.created_at, s.updated_at
    FROM schedules s
    JOIN schools sc ON s.school_id = sc.id
    ORDER BY s.academic_year DESC, s.is_first_half DESC, s.created_at DESC
    """
    schedules_cursor = conn.execute(query)
    schedules = [dict(row) for row in schedules_cursor.fetchall()]
    
    # Add start_date and end_date for backward compatibility
    for schedule in schedules:
        # Use school term dates or generate default dates
        if schedule['is_first_half']:
            schedule['start_date'] = f"{schedule['academic_year']}-04-01"
            schedule['end_date'] = f"{schedule['academic_year']}-09-30"
        else:
            schedule['start_date'] = f"{schedule['academic_year']}-10-01"
            next_year = schedule['academic_year'] + 1
            schedule['end_date'] = f"{next_year}-03-31"
    
    conn.close()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
def add_schedule():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"error": "Missing name for schedule"}), 400

    name = data['name']
    description = data.get('description', '')
    academic_year = data.get('academic_year', 2025)
    is_first_half = data.get('is_first_half', True)
    status = data.get('status', 'draft')
    school_id = data.get('school_id')

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Get the first school if school_id not provided
    if not school_id:
        cursor.execute('SELECT id FROM schools WHERE active = TRUE LIMIT 1')
        school_result = cursor.fetchone()
        if not school_result:
            conn.close()
            return jsonify({"error": "No active school found"}), 404
        school_id = school_result['id']

    try:
        cursor.execute('''
            INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (school_id, name, description, academic_year, is_first_half, status))
        conn.commit()
        new_schedule_id = cursor.lastrowid
        
        # Get school name for response
        school_name = cursor.execute('SELECT school_name FROM schools WHERE id = ?', (school_id,)).fetchone()['school_name']
        
        created_schedule = {
            "id": new_schedule_id,
            "name": name,
            "description": description,
            "academic_year": academic_year,
            "is_first_half": is_first_half,
            "status": status,
            "school_id": school_id,
            "school_name": school_name
        }
        
        # Add dates for compatibility
        if is_first_half:
            created_schedule['start_date'] = f"{academic_year}-04-01"
            created_schedule['end_date'] = f"{academic_year}-09-30"
        else:
            created_schedule['start_date'] = f"{academic_year}-10-01"
            created_schedule['end_date'] = f"{academic_year + 1}-03-31"
        
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create schedule: {e}"}), 409
    finally:
        conn.close()
    
    return jsonify(created_schedule), 201

@app.route('/api/schedules/<int:schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    conn = get_db_connection()
    
    # Get schedule basic info
    query = """
    SELECT s.id, s.schedule_name as name, s.description, s.academic_year,
           s.is_first_half, s.status, s.school_id, sc.school_name,
           s.created_at, s.updated_at
    FROM schedules s
    JOIN schools sc ON s.school_id = sc.id
    WHERE s.id = ?
    """
    schedule_cursor = conn.execute(query, (schedule_id,))
    schedule = schedule_cursor.fetchone()

    if not schedule:
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    schedule_dict = dict(schedule)
    
    # Add dates for compatibility
    if schedule_dict['is_first_half']:
        schedule_dict['start_date'] = f"{schedule_dict['academic_year']}-04-01"
        schedule_dict['end_date'] = f"{schedule_dict['academic_year']}-09-30"
    else:
        schedule_dict['start_date'] = f"{schedule_dict['academic_year']}-10-01"
        schedule_dict['end_date'] = f"{schedule_dict['academic_year'] + 1}-03-31"

    # Fetch assignments
    assignments_query = """
    SELECT sa.id, sa.schedule_id, sa.day_of_week, sa.library_room_id, 
           lr.room_name as library_name, sa.committee_member_id,
           cm.name as committee_member_name, sa.created_at
    FROM schedule_assignments sa
    JOIN library_rooms lr ON sa.library_room_id = lr.id
    JOIN committee_members cm ON sa.committee_member_id = cm.id
    WHERE sa.schedule_id = ?
    ORDER BY sa.day_of_week, lr.room_id
    """
    assignments_cursor = conn.execute(assignments_query, (schedule_id,))
    assignments = [dict(row) for row in assignments_cursor.fetchall()]
    
    # Convert to date-based format for backward compatibility
    weekday_names = ['', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    for assignment in assignments:
        day_of_week = assignment['day_of_week']
        assignment['date'] = weekday_names[day_of_week] if day_of_week <= 7 else str(day_of_week)
        assignment['time_slot'] = '09:00-10:00'  # Default time slot
        assignment['library_id'] = assignment['library_room_id']  # For compatibility
        assignment['assigned_committee_members'] = [
            {
                'id': assignment['committee_member_id'],
                'name': assignment['committee_member_name']
            }
        ]

    schedule_dict['assignments'] = assignments
    conn.close()
    return jsonify(schedule_dict)

@app.route('/api/schedules/<int:schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if schedule exists
    cursor.execute('SELECT * FROM schedules WHERE id = ?', (schedule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    
    field_mapping = {
        'name': 'schedule_name',
        'description': 'description',
        'academic_year': 'academic_year',
        'is_first_half': 'is_first_half',
        'status': 'status',
        'school_id': 'school_id'
    }
    
    for field, db_field in field_mapping.items():
        if field in data:
            update_fields.append(f"{db_field} = ?")
            params.append(data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    update_fields.append("updated_at = CURRENT_TIMESTAMP")
    params.append(schedule_id)

    try:
        cursor.execute(f'UPDATE schedules SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return get_schedule(schedule_id)

@app.route('/api/schedules/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    # Check if schedule exists
    cursor.execute('SELECT * FROM schedules WHERE id = ?', (schedule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    try:
        # Delete assignments first (CASCADE should handle this, but being explicit)
        cursor.execute('DELETE FROM schedule_assignments WHERE schedule_id = ?', (schedule_id,))
        cursor.execute('DELETE FROM schedules WHERE id = ?', (schedule_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error during schedule deletion: {e}"}), 500
    finally:
        conn.close()
    
    return jsonify({"message": "Schedule and its assignments deleted successfully"}), 200

# --- API Endpoints for Schedule Assignments ---

@app.route('/api/schedule-assignments', methods=['POST'])
def add_schedule_assignment():
    data = request.json
    required_fields = ['schedule_id', 'library_room_id', 'day_of_week', 'committee_member_id']
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more required fields: {', '.join(required_fields)}"}), 400

    schedule_id = data['schedule_id']
    library_room_id = data.get('library_room_id', data.get('library_id'))  # Support both names
    day_of_week = data['day_of_week']
    committee_member_id = data['committee_member_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    # Validate foreign keys
    if not cursor.execute("SELECT 1 FROM schedules WHERE id = ?", (schedule_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404
    if not cursor.execute("SELECT 1 FROM library_rooms WHERE id = ?", (library_room_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Library room not found"}), 404
    if not cursor.execute("SELECT 1 FROM committee_members WHERE id = ?", (committee_member_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Committee member not found"}), 404

    try:
        cursor.execute('''
            INSERT INTO schedule_assignments (schedule_id, day_of_week, library_room_id, committee_member_id)
            VALUES (?, ?, ?, ?)
        ''', (schedule_id, day_of_week, library_room_id, committee_member_id))
        new_assignment_id = cursor.lastrowid
        conn.commit()

        # Fetch the created assignment for the response
        query = """
        SELECT sa.id, sa.schedule_id, sa.day_of_week, sa.library_room_id,
               lr.room_name as library_name, sa.committee_member_id,
               cm.name as committee_member_name
        FROM schedule_assignments sa
        JOIN library_rooms lr ON sa.library_room_id = lr.id
        JOIN committee_members cm ON sa.committee_member_id = cm.id
        WHERE sa.id = ?
        """
        created_assignment_cursor = conn.execute(query, (new_assignment_id,))
        created_assignment = dict(created_assignment_cursor.fetchone())
        
        # Add compatibility fields
        created_assignment['library_id'] = created_assignment['library_room_id']
        created_assignment['assigned_committee_members'] = [
            {
                'id': created_assignment['committee_member_id'],
                'name': created_assignment['committee_member_name']
            }
        ]

    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create schedule assignment: {e}"}), 409
    finally:
        conn.close()
    
    return jsonify(created_assignment), 201

@app.route('/api/schedule-assignments/<int:assignment_id>', methods=['PUT'])
def update_schedule_assignment(assignment_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if assignment exists
    existing_assignment = cursor.execute("SELECT * FROM schedule_assignments WHERE id = ?", (assignment_id,)).fetchone()
    if not existing_assignment:
        conn.close()
        return jsonify({"error": "Schedule assignment not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    
    field_mapping = {
        'day_of_week': 'day_of_week',
        'library_room_id': 'library_room_id',
        'library_id': 'library_room_id',  # Support both names
        'committee_member_id': 'committee_member_id'
    }
    
    for field, db_field in field_mapping.items():
        if field in data:
            if db_field == 'library_room_id' and field == 'library_room_id':
                update_fields.append(f"{db_field} = ?")
                params.append(data[field])
            elif db_field == 'library_room_id' and field == 'library_id':
                update_fields.append(f"{db_field} = ?")
                params.append(data[field])
            elif field != 'library_id':  # Skip library_id if library_room_id was already processed
                update_fields.append(f"{db_field} = ?")
                params.append(data[field])

    if not update_fields:
        conn.close()
        return jsonify({"error": "No fields to update provided"}), 400

    params.append(assignment_id)

    try:
        cursor.execute(f'UPDATE schedule_assignments SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()

        # Fetch the updated assignment for response
        query = """
        SELECT sa.id, sa.schedule_id, sa.day_of_week, sa.library_room_id,
               lr.room_name as library_name, sa.committee_member_id,
               cm.name as committee_member_name
        FROM schedule_assignments sa
        JOIN library_rooms lr ON sa.library_room_id = lr.id
        JOIN committee_members cm ON sa.committee_member_id = cm.id
        WHERE sa.id = ?
        """
        updated_assignment_cursor = conn.execute(query, (assignment_id,))
        updated_assignment = dict(updated_assignment_cursor.fetchone())
        
        # Add compatibility fields
        updated_assignment['library_id'] = updated_assignment['library_room_id']
        updated_assignment['assigned_committee_members'] = [
            {
                'id': updated_assignment['committee_member_id'],
                'name': updated_assignment['committee_member_name']
            }
        ]

    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": f"Failed to update schedule assignment: {e}"}), 409
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify(updated_assignment)

@app.route('/api/schedule-assignments/<int:assignment_id>', methods=['DELETE'])
def delete_schedule_assignment(assignment_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    
    if not cursor.execute("SELECT 1 FROM schedule_assignments WHERE id = ?", (assignment_id,)).fetchone():
        conn.close()
        return jsonify({"error": "Schedule assignment not found"}), 404

    try:
        cursor.execute('DELETE FROM schedule_assignments WHERE id = ?', (assignment_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()
    
    return jsonify({"message": "Schedule assignment deleted successfully"}), 200

# --- API Endpoint for Schedule Generation ---
@app.route('/api/generate-schedule', methods=['POST'])
def generate_schedule_api():
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400
    
    logger.info(f"Received schedule generation request: {data}")
    
    # Extract data from request
    name = data.get('name')
    description = data.get('description', '')
    academic_year = data.get('academic_year', 2025)
    is_first_half = data.get('is_first_half', True)
    school_id = data.get('school_id')
    
    # Basic validation
    if not name:
        return jsonify({"error": "スケジュール名が必要です"}), 400
    
    # Get school_id if not provided
    if not school_id:
        try:
            conn = get_db_connection()
            cursor = conn.execute('SELECT id FROM schools WHERE active = TRUE LIMIT 1')
            school_result = cursor.fetchone()
            conn.close()
            if not school_result:
                return jsonify({"error": "アクティブな学校が見つかりません"}), 404
            school_id = school_result['id']
        except Exception as e:
            logger.error(f"学校取得エラー: {e}")
            return jsonify({"error": "学校情報の取得に失敗しました"}), 500
    
    try:
        # Try to use the schedule generator if available
        if 'generate_schedule_with_class' in globals():
            result = generate_schedule_with_class(
                school_id=school_id,
                academic_year=academic_year,
                is_first_half=is_first_half,
                name=name,
                description=description
            )
            
            if result.get('success'):
                return jsonify(result), 201
            else:
                return jsonify(result), 500
        else:
            # Fallback: create a basic schedule without assignments
            conn = get_db_connection()
            cursor = conn.cursor()
            
            cursor.execute('''
                INSERT INTO schedules (school_id, schedule_name, description, academic_year, is_first_half, status)
                VALUES (?, ?, ?, ?, ?, 'draft')
            ''', (school_id, name, description, academic_year, is_first_half))
            conn.commit()
            schedule_id = cursor.lastrowid
            conn.close()
            
            return jsonify({
                "success": True,
                "message": "基本スケジュールが作成されました（割り当てなし）",
                "schedule_id": schedule_id
            }), 201
            
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"スケジュール生成中にエラーが発生しました: {str(e)}\n{error_traceback}")
        return jsonify({"error": f"スケジュール生成中にエラーが発生しました: {str(e)}"}), 500

# --- Backward compatibility endpoints ---

@app.route('/api/grades', methods=['GET'])
def get_grades():
    """Backward compatibility: Map to classes grouped by grade"""
    conn = get_db_connection()
    query = """
    SELECT DISTINCT c.grade as id, (c.grade || '年') as name, 
           ('学年' || c.grade) as description
    FROM classes c
    WHERE c.active = TRUE
    ORDER BY c.grade
    """
    grades_cursor = conn.execute(query)
    grades = [dict(row) for row in grades_cursor.fetchall()]
    conn.close()
    return jsonify(grades)

@app.route('/')
def hello_world():
    return 'Hello, World! This is the mock backend with updated schema.'

if __name__ == '__main__':
    # Initialize database if it doesn't exist
    import os
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}. Initializing and seeding...")
        from db_setup import setup_database
        from seed_data import seed_data
        setup_database()
        seed_data()
        print("Database initialized and seeded.")
    else:
        # Check if schools table is empty, if so, seed
        conn_check = get_db_connection()
        try:
            count = conn_check.execute("SELECT COUNT(id) FROM schools").fetchone()[0]
            if count == 0:
                print("Schools table is empty. Seeding data...")
                from seed_data import seed_data
                seed_data()
                print("Data seeded.")
        except sqlite3.OperationalError:
            print("Schools table not found. Initializing and seeding...")
            from db_setup import setup_database
            from seed_data import seed_data
            setup_database()
            seed_data()
            print("Database initialized and seeded.")
        finally:
            conn_check.close()

    app.run(debug=True, port=5001)