from flask import Flask
from flask_cors import CORS

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# --- Logging Middleware ---
import logging
logging.basicConfig(level=logging.INFO, format='[MOCK_BACKEND LOG] %(asctime)s %(levelname)s: %(message)s')
logger = logging.getLogger("mock_backend")

# --- Import Schedule Generator ---
from schedule_generator import ScheduleGenerator, get_schedule_stats, generate_schedule_with_class

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

# --- API Endpoints for Grades ---

@app.route('/api/grades', methods=['GET'])
def get_grades():
    conn = get_db_connection()
    grades_cursor = conn.execute('SELECT * FROM grades')
    grades = [dict(row) for row in grades_cursor.fetchall()]
    conn.close()
    return jsonify(grades)

@app.route('/api/grades/<int:grade_id>', methods=['GET'])
def get_grade(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM grades WHERE id = ?', (grade_id,))
    grade = cursor.fetchone()
    conn.close()
    
    if grade is None:
        return jsonify({"error": "Grade not found"}), 404
        
    return jsonify(dict(grade))

@app.route('/api/grades', methods=['POST'])
def add_grade():
    new_grade_data = request.json
    if not new_grade_data or 'name' not in new_grade_data:
        return jsonify({"error": "Missing name in request body"}), 400

    name = new_grade_data['name']
    description = new_grade_data.get('description', '') # Optional description

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO grades (name, description) VALUES (?, ?)', (name, description))
        conn.commit()
        new_grade_id = cursor.lastrowid
        created_grade = {"id": new_grade_id, "name": name, "description": description}
    except sqlite3.IntegrityError:
        conn.close()
        return jsonify({"error": "Failed to create grade, possibly due to constraint violation"}), 409
    finally:
        conn.close()

    return jsonify(created_grade), 201

@app.route('/api/grades/<int:grade_id>', methods=['PUT'])
def update_grade(grade_id):
    update_data = request.json
    if not update_data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = update_data.get('name')
    description = update_data.get('description')

    if name is None and description is None:
        return jsonify({"error": "No fields to update provided (name or description)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if grade exists
    cursor.execute('SELECT * FROM grades WHERE id = ?', (grade_id,))
    grade = cursor.fetchone()
    if not grade:
        conn.close()
        return jsonify({"error": "Grade not found"}), 404

    # Build the update query
    update_fields = []
    params = []
    if name is not None:
        update_fields.append("name = ?")
        params.append(name)
    if description is not None:
        update_fields.append("description = ?")
        params.append(description)

    params.append(grade_id)

    try:
        cursor.execute(f'UPDATE grades SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    # Fetch the updated grade to return
    conn_fetch = get_db_connection()
    updated_grade_cursor = conn_fetch.execute('SELECT * FROM grades WHERE id = ?', (grade_id,))
    updated_grade = dict(updated_grade_cursor.fetchone())
    conn_fetch.close()

    return jsonify(updated_grade)


@app.route('/api/grades/<int:grade_id>', methods=['DELETE'])
def delete_grade(grade_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if grade exists
    cursor.execute('SELECT * FROM grades WHERE id = ?', (grade_id,))
    grade = cursor.fetchone()
    if not grade:
        conn.close()
        return jsonify({"error": "Grade not found"}), 404

    try:
        # Check for dependencies in 'classes' table
        cursor.execute('SELECT 1 FROM classes WHERE grade_id = ?', (grade_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete grade with associated classes. Please remove classes first."}), 409 # Conflict

        cursor.execute('DELETE FROM grades WHERE id = ?', (grade_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Grade deleted successfully"}), 200

# --- API Endpoints for Classes ---

@app.route('/api/classes', methods=['GET'])
def get_classes():
    conn = get_db_connection()
    # Join with grades to include grade_name
    query = """
    SELECT c.id, c.name, c.grade_id, g.name as grade_name
    FROM classes c
    JOIN grades g ON c.grade_id = g.id
    """
    classes_cursor = conn.execute(query)
    classes = [dict(row) for row in classes_cursor.fetchall()]
    conn.close()
    return jsonify(classes)

@app.route('/api/classes', methods=['POST'])
def add_class():
    new_class_data = request.json
    if not new_class_data or 'name' not in new_class_data or 'grade_id' not in new_class_data:
        return jsonify({"error": "Missing name or grade_id in request body"}), 400

    name = new_class_data['name']
    grade_id = new_class_data['grade_id']

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if grade_id exists
    cursor.execute('SELECT 1 FROM grades WHERE id = ?', (grade_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": f"Grade with id {grade_id} not found"}), 404

    try:
        cursor.execute('INSERT INTO classes (name, grade_id) VALUES (?, ?)', (name, grade_id))
        conn.commit()
        new_class_id = cursor.lastrowid
        # Fetch the grade_name for the response
        grade_name = cursor.execute('SELECT name FROM grades WHERE id = ?', (grade_id,)).fetchone()['name']
        created_class = {"id": new_class_id, "name": name, "grade_id": grade_id, "grade_name": grade_name}
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create class: {e}"}), 409 # Could be unique constraint or other integrity issue
    finally:
        conn.close()

    return jsonify(created_class), 201

@app.route('/api/classes/<int:class_id>', methods=['GET'])
def get_class(class_id):
    conn = get_db_connection()
    query = """
    SELECT c.id, c.name, c.grade_id, g.name as grade_name
    FROM classes c
    JOIN grades g ON c.grade_id = g.id
    WHERE c.id = ?
    """
    class_cursor = conn.execute(query, (class_id,))
    class_record = class_cursor.fetchone()
    conn.close()

    if not class_record:
        return jsonify({"error": "Class not found"}), 404
    return jsonify(dict(class_record))


@app.route('/api/classes/<int:class_id>', methods=['PUT'])
def update_class(class_id):
    update_data = request.json
    if not update_data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = update_data.get('name')
    grade_id = update_data.get('grade_id')

    if name is None and grade_id is None:
        return jsonify({"error": "No fields to update provided (name or grade_id)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if class exists
    cursor.execute('SELECT * FROM classes WHERE id = ?', (class_id,))
    class_record = cursor.fetchone()
    if not class_record:
        conn.close()
        return jsonify({"error": "Class not found"}), 404

    # If grade_id is being updated, check if the new grade_id exists
    if grade_id is not None:
        cursor.execute('SELECT 1 FROM grades WHERE id = ?', (grade_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": f"Grade with id {grade_id} not found"}), 404

    update_fields = []
    params = []
    if name is not None:
        update_fields.append("name = ?")
        params.append(name)
    if grade_id is not None:
        update_fields.append("grade_id = ?")
        params.append(grade_id)
    params.append(class_id)

    try:
        cursor.execute(f'UPDATE classes SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        # Don't close here if we need to fetch updated record
        pass


    # Fetch the updated class with grade_name to return
    query = """
    SELECT c.id, c.name, c.grade_id, g.name as grade_name
    FROM classes c
    JOIN grades g ON c.grade_id = g.id
    WHERE c.id = ?
    """
    updated_class_cursor = conn.execute(query, (class_id,))
    updated_class_record = dict(updated_class_cursor.fetchone())
    conn.close()

    return jsonify(updated_class_record)

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
        # Check for dependencies in 'committee_members' table
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
    SELECT cm.id, cm.name, cm.role, cm.class_id, c.name as class_name, g.id as grade_id, g.name as grade_name
    FROM committee_members cm
    JOIN classes c ON cm.class_id = c.id
    JOIN grades g ON c.grade_id = g.id
    """
    members_cursor = conn.execute(query)
    members = [dict(row) for row in members_cursor.fetchall()]
    conn.close()
    return jsonify(members)

@app.route('/api/committee-members', methods=['POST'])
def add_committee_member():
    data = request.json
    if not data or not data.get('name') or not data.get('class_id'):
        return jsonify({"error": "Missing name or class_id"}), 400

    name = data['name']
    class_id = data['class_id']
    role = data.get('role', 'メンバー') # Default role

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if class_id exists
    cursor.execute('SELECT 1 FROM classes WHERE id = ?', (class_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": f"Class with id {class_id} not found"}), 404

    try:
        cursor.execute('INSERT INTO committee_members (name, class_id, role) VALUES (?, ?, ?)',
                       (name, class_id, role))
        conn.commit()
        new_member_id = cursor.lastrowid

        # Fetch related info for the response
        query = """
        SELECT cm.id, cm.name, cm.role, cm.class_id, c.name as class_name, g.id as grade_id, g.name as grade_name
        FROM committee_members cm
        JOIN classes c ON cm.class_id = c.id
        JOIN grades g ON c.grade_id = g.id
        WHERE cm.id = ?
        """
        new_member_details_cursor = conn.execute(query, (new_member_id,))
        created_member = dict(new_member_details_cursor.fetchone())

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
    SELECT cm.id, cm.name, cm.role, cm.class_id, c.name as class_name, g.id as grade_id, g.name as grade_name
    FROM committee_members cm
    JOIN classes c ON cm.class_id = c.id
    JOIN grades g ON c.grade_id = g.id
    WHERE cm.id = ?
    """
    member_cursor = conn.execute(query, (member_id,))
    member = member_cursor.fetchone()
    conn.close()

    if not member:
        return jsonify({"error": "Committee member not found"}), 404
    return jsonify(dict(member))

@app.route('/api/committee-members/<int:member_id>', methods=['PUT'])
def update_committee_member(member_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = data.get('name')
    class_id = data.get('class_id')
    role = data.get('role')

    if name is None and class_id is None and role is None:
        return jsonify({"error": "No fields to update provided (name, class_id, or role)"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if member exists
    cursor.execute('SELECT * FROM committee_members WHERE id = ?', (member_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Committee member not found"}), 404

    # If class_id is being updated, check if the new class_id exists
    if class_id is not None:
        cursor.execute('SELECT 1 FROM classes WHERE id = ?', (class_id,))
        if not cursor.fetchone():
            conn.close()
            return jsonify({"error": f"Class with id {class_id} not found"}), 404

    update_fields = []
    params = []
    if name is not None:
        update_fields.append("name = ?")
        params.append(name)
    if class_id is not None:
        update_fields.append("class_id = ?")
        params.append(class_id)
    if role is not None:
        update_fields.append("role = ?")
        params.append(role)
    params.append(member_id)

    try:
        cursor.execute(f'UPDATE committee_members SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    # No finally conn.close() here, as we need it for the fetch below

    # Fetch the updated member with class and grade details
    query = """
    SELECT cm.id, cm.name, cm.role, cm.class_id, c.name as class_name, g.id as grade_id, g.name as grade_name
    FROM committee_members cm
    JOIN classes c ON cm.class_id = c.id
    JOIN grades g ON c.grade_id = g.id
    WHERE cm.id = ?
    """
    updated_member_cursor = conn.execute(query, (member_id,))
    updated_member = dict(updated_member_cursor.fetchone())
    conn.close()

    return jsonify(updated_member)

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
        # Check for dependencies in 'schedule_assignments' or 'assignment_members'
        cursor.execute('SELECT 1 FROM schedule_assignments WHERE committee_member_id = ?', (member_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete member with direct schedule assignments. Please update assignments first."}), 409

        cursor.execute('SELECT 1 FROM assignment_members WHERE committee_member_id = ?', (member_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete member assigned to shifts (via assignment_members). Please update assignments first."}), 409

        cursor.execute('DELETE FROM committee_members WHERE id = ?', (member_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Committee member deleted successfully"}), 200

# --- API Endpoints for Libraries ---

@app.route('/api/libraries', methods=['GET'])
def get_libraries():
    conn = get_db_connection()
    # Also fetch availability for each library
    libraries_cursor = conn.execute('SELECT * FROM libraries')
    libraries = []
    for lib_row in libraries_cursor.fetchall():
        lib_dict = dict(lib_row)
        availability_cursor = conn.execute('SELECT id, day_of_week, open_time, close_time FROM library_availability WHERE library_id = ? ORDER BY day_of_week', (lib_dict['id'],))
        lib_dict['availability'] = [dict(avail_row) for avail_row in availability_cursor.fetchall()]
        libraries.append(lib_dict)
    conn.close()
    return jsonify(libraries)

@app.route('/api/libraries', methods=['POST'])
def add_library():
    data = request.json
    if not data or not data.get('name'):
        return jsonify({"error": "Missing name for library"}), 400

    name = data['name']
    location = data.get('location', '')
    capacity = data.get('capacity', None)
    is_active = data.get('is_active', True)
    availability_data = data.get('availability', []) # Expects a list of availability dicts

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO libraries (name, location, capacity, is_active) VALUES (?, ?, ?, ?)',
                       (name, location, capacity, 1 if is_active else 0))
        conn.commit()
        new_library_id = cursor.lastrowid

        if availability_data:
            for avail in availability_data:
                if not all(k in avail for k in ('day_of_week', 'open_time', 'close_time')):
                    # Log this or handle error, but continue creating the library
                    print(f"Warning: Skipping invalid availability entry for library {new_library_id}: {avail}")
                    continue
                cursor.execute('''
                    INSERT INTO library_availability (library_id, day_of_week, open_time, close_time)
                    VALUES (?, ?, ?, ?)
                ''', (new_library_id, avail['day_of_week'], avail['open_time'], avail['close_time']))
            conn.commit()

        # Fetch the created library with its availability
        created_library_cursor = conn.execute('SELECT * FROM libraries WHERE id = ?', (new_library_id,))
        created_library = dict(created_library_cursor.fetchone())
        availability_cursor = conn.execute('SELECT id, day_of_week, open_time, close_time FROM library_availability WHERE library_id = ? ORDER BY day_of_week', (new_library_id,))
        created_library['availability'] = [dict(avail_row) for avail_row in availability_cursor.fetchall()]

    except sqlite3.IntegrityError as e:
        conn.rollback() # Rollback if any part fails
        return jsonify({"error": f"Failed to create library: {e}"}), 409
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify(created_library), 201

@app.route('/api/libraries/<int:library_id>', methods=['GET'])
def get_library(library_id):
    conn = get_db_connection()
    library_cursor = conn.execute('SELECT * FROM libraries WHERE id = ?', (library_id,))
    library = library_cursor.fetchone()

    if not library:
        conn.close()
        return jsonify({"error": "Library not found"}), 404

    library_dict = dict(library)
    availability_cursor = conn.execute('SELECT id, day_of_week, open_time, close_time FROM library_availability WHERE library_id = ? ORDER BY day_of_week', (library_id,))
    library_dict['availability'] = [dict(avail_row) for avail_row in availability_cursor.fetchall()]
    conn.close()
    return jsonify(library_dict)


@app.route('/api/libraries/<int:library_id>', methods=['PUT'])
def update_library(library_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = data.get('name')
    location = data.get('location')
    capacity = data.get('capacity')
    is_active = data.get('is_active') # Boolean
    # For PUT, we expect full replacement of availability, or specific instructions on how to update.
    # Simple approach: delete all existing availability and add new ones if provided.
    availability_data = data.get('availability') # If None, availability is not being updated. If [], it's being cleared.


    if all(x is None for x in [name, location, capacity, is_active, availability_data]):
        return jsonify({"error": "No fields to update provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if library exists
    cursor.execute('SELECT * FROM libraries WHERE id = ?', (library_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Library not found"}), 404

    try:
        update_fields = []
        params = []
        if name is not None:
            update_fields.append("name = ?")
            params.append(name)
        if location is not None:
            update_fields.append("location = ?")
            params.append(location)
        if capacity is not None:
            update_fields.append("capacity = ?")
            params.append(capacity)
        if is_active is not None: # Check for boolean explicitly
            update_fields.append("is_active = ?")
            params.append(1 if is_active else 0)

        if update_fields: # Only run update if there are fields for the libraries table
            params.append(library_id)
            cursor.execute(f'UPDATE libraries SET {", ".join(update_fields)} WHERE id = ?', tuple(params))

        if availability_data is not None: # If availability_data is provided (even an empty list)
            # Delete existing availability for this library
            cursor.execute('DELETE FROM library_availability WHERE library_id = ?', (library_id,))
            # Add new availability entries
            for avail in availability_data:
                if not all(k in avail for k in ('day_of_week', 'open_time', 'close_time')):
                    # Or raise an error and rollback
                    print(f"Warning: Skipping invalid availability entry for library {library_id} during update: {avail}")
                    continue
                cursor.execute('''
                    INSERT INTO library_availability (library_id, day_of_week, open_time, close_time)
                    VALUES (?, ?, ?, ?)
                ''', (library_id, avail['day_of_week'], avail['open_time'], avail['close_time']))
        conn.commit()

    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close() # Close after commit or rollback

    # Fetch the updated library with its availability to return
    return get_library(library_id) # Re-use the get_library function


@app.route('/api/libraries/<int:library_id>', methods=['DELETE'])
def delete_library(library_id):
    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if library exists
    cursor.execute('SELECT * FROM libraries WHERE id = ?', (library_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Library not found"}), 404

    try:
        # Check for dependencies: schedule_assignments, library_availability
        cursor.execute('SELECT 1 FROM schedule_assignments WHERE library_id = ?', (library_id,))
        if cursor.fetchone():
            conn.close()
            return jsonify({"error": "Cannot delete library with associated schedule assignments."}), 409

        # Delete associated availability first
        cursor.execute('DELETE FROM library_availability WHERE library_id = ?', (library_id,))
        # Then delete the library
        cursor.execute('DELETE FROM libraries WHERE id = ?', (library_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()

    return jsonify({"message": "Library and its availability deleted successfully"}), 200

# --- API Endpoints for Schedule Rules ---

@app.route('/api/schedule-rules', methods=['GET'])
def get_schedule_rules():
    conn = get_db_connection()
    rules_cursor = conn.execute('SELECT * FROM schedule_rules ORDER BY priority')
    rules = [dict(row) for row in rules_cursor.fetchall()]
    conn.close()
    return jsonify(rules)

@app.route('/api/schedule-rules', methods=['POST'])
def add_schedule_rule():
    data = request.json
    if not data or not data.get('name') or not data.get('type') or data.get('priority') is None:
        return jsonify({"error": "Missing name, type, or priority for schedule rule"}), 400

    name = data['name']
    description = data.get('description', '')
    rule_type = data['type']
    priority = data['priority']

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO schedule_rules (name, description, type, priority) VALUES (?, ?, ?, ?)',
                       (name, description, rule_type, priority))
        conn.commit()
        new_rule_id = cursor.lastrowid
        created_rule = {"id": new_rule_id, "name": name, "description": description, "type": rule_type, "priority": priority}
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create schedule rule: {e}"}), 409
    finally:
        conn.close()
    return jsonify(created_rule), 201

@app.route('/api/schedule-rules/<int:rule_id>', methods=['GET'])
def get_schedule_rule(rule_id):
    conn = get_db_connection()
    rule_cursor = conn.execute('SELECT * FROM schedule_rules WHERE id = ?', (rule_id,))
    rule = rule_cursor.fetchone()
    conn.close()
    if not rule:
        return jsonify({"error": "Schedule rule not found"}), 404
    return jsonify(dict(rule))

@app.route('/api/schedule-rules/<int:rule_id>', methods=['PUT'])
def update_schedule_rule(rule_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = data.get('name')
    description = data.get('description')
    rule_type = data.get('type')
    priority = data.get('priority')

    if all(x is None for x in [name, description, rule_type, priority]):
        return jsonify({"error": "No fields to update provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM schedule_rules WHERE id = ?', (rule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule rule not found"}), 404

    update_fields = []
    params = []
    if name is not None:
        update_fields.append("name = ?")
        params.append(name)
    if description is not None: # Note: description can be set to empty string
        update_fields.append("description = ?")
        params.append(description)
    if rule_type is not None:
        update_fields.append("type = ?")
        params.append(rule_type)
    if priority is not None:
        update_fields.append("priority = ?")
        params.append(priority)
    params.append(rule_id)

    try:
        cursor.execute(f'UPDATE schedule_rules SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    
    # Fetch the updated rule
    updated_rule_cursor = conn.execute('SELECT * FROM schedule_rules WHERE id = ?', (rule_id,))
    updated_rule = dict(updated_rule_cursor.fetchone())
    conn.close()
    return jsonify(updated_rule)

@app.route('/api/schedule-rules/<int:rule_id>', methods=['DELETE'])
def delete_schedule_rule(rule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM schedule_rules WHERE id = ?', (rule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule rule not found"}), 404

    try:
        # No direct dependencies to check for schedule_rules in this schema, but good practice if they existed
        cursor.execute('DELETE FROM schedule_rules WHERE id = ?', (rule_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()
    return jsonify({"message": "Schedule rule deleted successfully"}), 200

# --- API Endpoints for Schedules ---

@app.route('/api/schedules', methods=['GET'])
def get_schedules():
    conn = get_db_connection()
    schedules_cursor = conn.execute('SELECT * FROM schedules ORDER BY start_date DESC')
    schedules = [dict(row) for row in schedules_cursor.fetchall()]
    conn.close()
    return jsonify(schedules)

@app.route('/api/schedules', methods=['POST'])
def add_schedule():
    data = request.json
    if not data or not data.get('name') or not data.get('start_date') or not data.get('end_date'):
        return jsonify({"error": "Missing name, start_date, or end_date for schedule"}), 400

    name = data['name']
    description = data.get('description', '')
    start_date = data['start_date']
    end_date = data['end_date']

    conn = get_db_connection()
    cursor = conn.cursor()
    try:
        cursor.execute('INSERT INTO schedules (name, description, start_date, end_date) VALUES (?, ?, ?, ?)',
                       (name, description, start_date, end_date))
        conn.commit()
        new_schedule_id = cursor.lastrowid
        created_schedule = {"id": new_schedule_id, "name": name, "description": description, "start_date": start_date, "end_date": end_date}
    except sqlite3.IntegrityError as e:
        conn.close()
        return jsonify({"error": f"Failed to create schedule: {e}"}), 409
    finally:
        conn.close()
    return jsonify(created_schedule), 201

@app.route('/api/schedules/<int:schedule_id>', methods=['GET'])
def get_schedule(schedule_id):
    conn = get_db_connection()
    schedule_cursor = conn.execute('SELECT * FROM schedules WHERE id = ?', (schedule_id,))
    schedule = schedule_cursor.fetchone()

    if not schedule:
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    schedule_dict = dict(schedule)
    # Fetch detailed assignments for this schedule
    assignments_query = """
    SELECT
        sa.id, sa.schedule_id, sa.library_id, l.name as library_name,
        sa.date, sa.time_slot,
        sa.committee_member_id, cm_direct.name as committee_member_name
    FROM schedule_assignments sa
    LEFT JOIN libraries l ON sa.library_id = l.id
    LEFT JOIN committee_members cm_direct ON sa.committee_member_id = cm_direct.id
    WHERE sa.schedule_id = ?
    ORDER BY sa.date, sa.time_slot
    """
    assignments_cursor = conn.execute(assignments_query, (schedule_id,))
    assignments = []
    for assign_row in assignments_cursor.fetchall():
        assign_dict = dict(assign_row)
        # Fetch members from assignment_members for this specific assignment
        member_query = """
        SELECT cm.id, cm.name, cm.role
        FROM committee_members cm
        JOIN assignment_members am ON cm.id = am.committee_member_id
        WHERE am.assignment_id = ?
        """
        members_cursor = conn.execute(member_query, (assign_dict['id'],))
        assign_dict['assigned_committee_members'] = [dict(mem_row) for mem_row in members_cursor.fetchall()]
        # If there was a direct committee_member_id and no one in assignment_members, add that one.
        # (This logic might need refinement based on how committee_member_id and assignment_members are used together)
        if assign_dict['committee_member_id'] and not assign_dict['assigned_committee_members']:
             # Fetch details for the directly assigned member if not already covered
            direct_member_details_cursor = conn.execute("SELECT id, name, role FROM committee_members WHERE id = ?", (assign_dict['committee_member_id'],))
            direct_member_details = direct_member_details_cursor.fetchone()
            if direct_member_details:
                 assign_dict['assigned_committee_members'].append(dict(direct_member_details))

        assignments.append(assign_dict)

    schedule_dict['assignments'] = assignments
    conn.close()
    return jsonify(schedule_dict)

@app.route('/api/schedules/<int:schedule_id>', methods=['PUT'])
def update_schedule(schedule_id):
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400

    name = data.get('name')
    description = data.get('description')
    start_date = data.get('start_date')
    end_date = data.get('end_date')

    if all(x is None for x in [name, description, start_date, end_date]):
        return jsonify({"error": "No fields to update provided"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM schedules WHERE id = ?', (schedule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    update_fields = []
    params = []
    if name is not None: update_fields.append("name = ?"); params.append(name)
    if description is not None: update_fields.append("description = ?"); params.append(description)
    if start_date is not None: update_fields.append("start_date = ?"); params.append(start_date)
    if end_date is not None: update_fields.append("end_date = ?"); params.append(end_date)
    params.append(schedule_id)

    try:
        cursor.execute(f'UPDATE schedules SET {", ".join(update_fields)} WHERE id = ?', tuple(params))
        conn.commit()
    except sqlite3.Error as e:
        conn.close()
        return jsonify({"error": f"Database error: {e}"}), 500
    
    conn.close() # Close before calling get_schedule which opens its own connection
    return get_schedule(schedule_id) # Return the updated schedule with assignments

@app.route('/api/schedules/<int:schedule_id>', methods=['DELETE'])
def delete_schedule(schedule_id):
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM schedules WHERE id = ?', (schedule_id,))
    if not cursor.fetchone():
        conn.close()
        return jsonify({"error": "Schedule not found"}), 404

    try:
        # Need to delete related assignments and their M:N entries in assignment_members first
        cursor.execute('DELETE FROM assignment_members WHERE assignment_id IN (SELECT id FROM schedule_assignments WHERE schedule_id = ?)', (schedule_id,))
        cursor.execute('DELETE FROM schedule_assignments WHERE schedule_id = ?', (schedule_id,))
        cursor.execute('DELETE FROM schedules WHERE id = ?', (schedule_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error during schedule deletion: {e}"}), 500
    finally:
        conn.close()
    return jsonify({"message": "Schedule and its assignments deleted successfully"}), 200


# --- API Endpoints for Schedule Assignments (and Assignment Members) ---
# These are mostly managed via the /api/schedules/<id> endpoint for fetching.
# But providing direct manipulation for assignments might be useful.

@app.route('/api/schedule-assignments', methods=['POST'])
def add_schedule_assignment():
    data = request.json
    required_fields = ['schedule_id', 'library_id', 'date', 'time_slot']
    if not data or not all(field in data for field in required_fields):
        return jsonify({"error": f"Missing one or more required fields: {', '.join(required_fields)}"}), 400

    schedule_id = data['schedule_id']
    library_id = data['library_id']
    # committee_member_id is optional if assigned_committee_member_ids is used
    committee_member_id = data.get('committee_member_id', None)
    date = data['date']
    time_slot = data['time_slot']
    # For M:N relationship, expect a list of member IDs
    assigned_committee_member_ids = data.get('assigned_committee_member_ids', [])

    conn = get_db_connection()
    cursor = conn.cursor()

    # Validate foreign keys
    if not cursor.execute("SELECT 1 FROM schedules WHERE id = ?", (schedule_id,)).fetchone():
        conn.close(); return jsonify({"error": "Schedule not found"}), 404
    if not cursor.execute("SELECT 1 FROM libraries WHERE id = ?", (library_id,)).fetchone():
        conn.close(); return jsonify({"error": "Library not found"}), 404
    if committee_member_id and not cursor.execute("SELECT 1 FROM committee_members WHERE id = ?", (committee_member_id,)).fetchone():
        conn.close(); return jsonify({"error": "Directly assigned committee member not found"}), 404
    for mem_id in assigned_committee_member_ids:
        if not cursor.execute("SELECT 1 FROM committee_members WHERE id = ?", (mem_id,)).fetchone():
            conn.close(); return jsonify({"error": f"Assigned committee member with ID {mem_id} not found"}), 404
    
    # If committee_member_id is provided AND assigned_committee_member_ids is also provided,
    # ensure committee_member_id is part of assigned_committee_member_ids or add it.
    # For simplicity, if committee_member_id is set, we'll use it as the single assignee unless assigned_committee_member_ids is non-empty.
    # If assigned_committee_member_ids is non-empty, committee_member_id in the table will be NULL.
    actual_committee_member_id_for_table = None
    if assigned_committee_member_ids:
        actual_committee_member_id_for_table = None # Use assignment_members table
    elif committee_member_id:
        actual_committee_member_id_for_table = committee_member_id # Use direct link
        if committee_member_id not in assigned_committee_member_ids: # if direct and not in list, add to list for response consistency
             assigned_committee_member_ids.append(committee_member_id)


    try:
        cursor.execute('''
            INSERT INTO schedule_assignments (schedule_id, library_id, committee_member_id, date, time_slot)
            VALUES (?, ?, ?, ?, ?)
        ''', (schedule_id, library_id, actual_committee_member_id_for_table, date, time_slot))
        new_assignment_id = cursor.lastrowid

        if assigned_committee_member_ids and actual_committee_member_id_for_table is None:
            for member_id_to_assign in assigned_committee_member_ids:
                cursor.execute('INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (?, ?)',
                               (new_assignment_id, member_id_to_assign))
        conn.commit()

        # Fetch the created assignment for the response
        # This is a simplified fetch, get_schedule(schedule_id) has more detail
        created_assignment_cursor = conn.execute("SELECT * FROM schedule_assignments WHERE id = ?", (new_assignment_id,))
        created_assignment = dict(created_assignment_cursor.fetchone())
        # Also fetch assigned members for the response
        members_for_response = []
        if assigned_committee_member_ids:
            for mem_id in assigned_committee_member_ids:
                 member_detail_cursor = conn.execute("SELECT id, name, role FROM committee_members WHERE id = ?", (mem_id,))
                 member_detail = member_detail_cursor.fetchone()
                 if member_detail: members_for_response.append(dict(member_detail))

        created_assignment['assigned_committee_members'] = members_for_response


    except sqlite3.IntegrityError as e:
        conn.rollback()
        return jsonify({"error": f"Failed to create schedule assignment: {e}"}), 409
    finally:
        conn.close()
    return jsonify(created_assignment), 201


@app.route('/api/schedule-assignments/<int:assignment_id>', methods=['PUT'])
def update_schedule_assignment(assignment_id):
    data = request.json
    if not data: return jsonify({"error": "Request body cannot be empty"}), 400

    conn = get_db_connection()
    cursor = conn.cursor()

    # Check if assignment exists
    existing_assignment = cursor.execute("SELECT * FROM schedule_assignments WHERE id = ?", (assignment_id,)).fetchone()
    if not existing_assignment:
        conn.close(); return jsonify({"error": "Schedule assignment not found"}), 404

    # Fields that can be updated
    library_id = data.get('library_id', existing_assignment['library_id'])
    date = data.get('date', existing_assignment['date'])
    time_slot = data.get('time_slot', existing_assignment['time_slot'])
    # committee_member_id and assigned_committee_member_ids need careful handling
    committee_member_id = data.get('committee_member_id', None) # Explicitly get, default to None if not provided for update
    assigned_committee_member_ids = data.get('assigned_committee_member_ids', None) # None means don't update this part

    # Validate FKs if changed
    if data.get('library_id') and not cursor.execute("SELECT 1 FROM libraries WHERE id = ?", (library_id,)).fetchone():
        conn.close(); return jsonify({"error": "Library not found"}), 404
    if data.get('committee_member_id') and committee_member_id and not cursor.execute("SELECT 1 FROM committee_members WHERE id = ?", (committee_member_id,)).fetchone():
        conn.close(); return jsonify({"error": "Direct committee member not found"}), 404
    if assigned_committee_member_ids: # If this list is provided, validate all members in it
        for mem_id in assigned_committee_member_ids:
            if not cursor.execute("SELECT 1 FROM committee_members WHERE id = ?", (mem_id,)).fetchone():
                conn.close(); return jsonify({"error": f"Assigned committee member ID {mem_id} not found"}), 404
    
    actual_committee_member_id_for_table = existing_assignment['committee_member_id']
    if assigned_committee_member_ids is not None: # If list is provided (even empty)
        actual_committee_member_id_for_table = None # Will use assignment_members
    elif committee_member_id is not None: # If only direct ID is provided for update
        actual_committee_member_id_for_table = committee_member_id


    try:
        cursor.execute('''
            UPDATE schedule_assignments
            SET library_id = ?, committee_member_id = ?, date = ?, time_slot = ?
            WHERE id = ?
        ''', (library_id, actual_committee_member_id_for_table, date, time_slot, assignment_id))

        if assigned_committee_member_ids is not None: # If this part of request is present (even if empty list)
            # Clear existing M:N links for this assignment
            cursor.execute('DELETE FROM assignment_members WHERE assignment_id = ?', (assignment_id,))
            # Add new M:N links if any
            if assigned_committee_member_ids: # If the list is not empty
                for member_id_to_assign in assigned_committee_member_ids:
                    cursor.execute('INSERT INTO assignment_members (assignment_id, committee_member_id) VALUES (?, ?)',
                                   (assignment_id, member_id_to_assign))
            # If a direct committee_member_id was set AND assigned_committee_member_ids was also set (and empty),
            # this logic ensures the direct one is also cleared from assignment_members.
        elif actual_committee_member_id_for_table is not None: # Only direct ID was updated, clear M:N
             cursor.execute('DELETE FROM assignment_members WHERE assignment_id = ?', (assignment_id,))


        conn.commit()

        # Fetch the updated assignment for response
        updated_assignment_cursor = conn.execute("SELECT * FROM schedule_assignments WHERE id = ?", (assignment_id,))
        updated_assignment = dict(updated_assignment_cursor.fetchone())
        
        # Fetch associated members for the response
        members_for_response = []
        current_assigned_ids = []
        if assigned_committee_member_ids is not None: # If update included this list
            current_assigned_ids = assigned_committee_member_ids
        elif actual_committee_member_id_for_table is not None: # If update was for direct member
            current_assigned_ids = [actual_committee_member_id_for_table]
        else: # Fetch from assignment_members if neither direct nor list was part of update, but they might exist
            member_ids_cursor = conn.execute("SELECT committee_member_id FROM assignment_members WHERE assignment_id = ?", (assignment_id,))
            current_assigned_ids = [row['committee_member_id'] for row in member_ids_cursor.fetchall()]
            if not current_assigned_ids and updated_assignment.get('committee_member_id'): # Fallback to direct if no M:N and direct exists
                current_assigned_ids = [updated_assignment['committee_member_id']]


        for mem_id in current_assigned_ids:
             member_detail_cursor = conn.execute("SELECT id, name, role FROM committee_members WHERE id = ?", (mem_id,))
             member_detail = member_detail_cursor.fetchone()
             if member_detail: members_for_response.append(dict(member_detail))
        updated_assignment['assigned_committee_members'] = members_for_response


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
        conn.close(); return jsonify({"error": "Schedule assignment not found"}), 404

    try:
        # Delete from M:N table first
        cursor.execute('DELETE FROM assignment_members WHERE assignment_id = ?', (assignment_id,))
        # Then delete the assignment itself
        cursor.execute('DELETE FROM schedule_assignments WHERE id = ?', (assignment_id,))
        conn.commit()
    except sqlite3.Error as e:
        conn.rollback()
        return jsonify({"error": f"Database error: {e}"}), 500
    finally:
        conn.close()
    return jsonify({"message": "Schedule assignment deleted successfully"}), 200


@app.route('/')
def hello_world():
    return 'Hello, World! This is the mock backend.'

# --- API Endpoint for Schedule Generation ---
@app.route('/api/generate-schedule', methods=['POST'])
def generate_schedule_api():
    data = request.json
    if not data:
        return jsonify({"error": "Request body cannot be empty"}), 400
    
    logger.info(f"Received schedule generation request: {data}")
    
    # フロントエンドからのデータを処理
    name = data.get('name')
    description = data.get('description', '')
    start_date = data.get('startDate')
    end_date = data.get('endDate')
    selected_members = data.get('selectedMembers', [])
    excluded_dates = data.get('excludedDates', [])
    
    # 年度と学期の取得（フロントエンドから送信された場合はそれを使用）
    academic_year = data.get('academicYear')
    is_first_half = data.get('isFirstHalf')
    
    # 基本的なバリデーション
    if not name:
        return jsonify({"error": "スケジュール名が必要です"}), 400
    
    if not start_date or not end_date:
        return jsonify({"error": "開始日と終了日が必要です"}), 400
    
    # selectedMembersが空の場合、全ての図書委員を取得
    if not selected_members:
        try:
            conn = get_db_connection()
            cursor = conn.execute("""
                SELECT cm.id FROM committee_members cm
                JOIN classes c ON cm.class_id = c.id
                JOIN grades g ON c.grade_id = g.id
                WHERE g.name IN ('5年生', '6年生')
            """)
            all_members = [row['id'] for row in cursor.fetchall()]
            conn.close()
            selected_members = all_members
            logger.info(f"selectedMembersが空のため、全図書委員を使用: {selected_members}")
        except Exception as e:
            logger.error(f"図書委員取得エラー: {e}")
            return jsonify({"error": "図書委員の取得に失敗しました"}), 500
    
    if len(selected_members) < 2:
        return jsonify({"error": "少なくとも2人の図書委員が必要です"}), 400
    
    # 年度と学期の自動判定（フロントエンドから送信されていない場合）
    if not academic_year or is_first_half is None:
        try:
            from datetime import datetime
            start_dt = datetime.strptime(start_date, '%Y-%m-%d')
            
            # 年度の判定（4月始まりとして）
            if start_dt.month >= 4:
                auto_academic_year = str(start_dt.year)
            else:
                auto_academic_year = str(start_dt.year - 1)
            
            # 学期の判定（4-9月が前期、10-3月が後期）
            auto_is_first_half = start_dt.month >= 4 and start_dt.month <= 9
            
            # フロントエンドからの値がない場合のみ自動判定値を使用
            if not academic_year:
                academic_year = auto_academic_year
            if is_first_half is None:
                is_first_half = auto_is_first_half
                
            logger.info(f"自動判定: 年度={academic_year}, 前期={is_first_half}")
            
        except ValueError:
            return jsonify({"error": "無効な日付形式です"}), 400
    else:
        logger.info(f"フロントエンドから受信: 年度={academic_year}, 前期={is_first_half}")
    
    try:
        # デバッグ用にパラメータを出力
        logger.info(f"generate_schedule params: name={name}, description={description}, start_date={start_date}, end_date={end_date}, academic_year={academic_year}, is_first_half={is_first_half}")
        
        result = generate_schedule_with_class(
            academic_year=academic_year,
            is_first_half=is_first_half,
            name=name,
            description=description,
            start_date=start_date,
            end_date=end_date
        )
        
        if result.get('success'):
            return jsonify(result), 201
        else:
            return jsonify(result), 500
            
    except Exception as e:
        import traceback
        error_traceback = traceback.format_exc()
        logger.error(f"スケジュール生成中にエラーが発生しました: {str(e)}\n{error_traceback}")
        return jsonify({"error": f"スケジュール生成中にエラーが発生しました: {str(e)}"}), 500

if __name__ == '__main__':
    # It's good practice to set up the database if it doesn't exist or is empty before running the app
    # For a real app, you might use migrations (e.g., Alembic with SQLAlchemy)
    # For this mock backend, we can run the setup and seed scripts if the DB is new.
    import os
    if not os.path.exists(DATABASE_PATH):
        print(f"Database not found at {DATABASE_PATH}. Initializing and seeding...")
        from db_setup import setup_database
        from seed_data import seed_data
        setup_database()
        seed_data()
        print("Database initialized and seeded.")
    else:
        # Check if grades table is empty, if so, seed.
        # This is a simple check; a more robust check might be needed for complex scenarios.
        conn_check = get_db_connection()
        try:
            count = conn_check.execute("SELECT COUNT(id) FROM grades").fetchone()[0]
            if count == 0:
                print("Grades table is empty. Seeding data...")
                from seed_data import seed_data
                seed_data() # This assumes tables already exist
                print("Data seeded.")
        except sqlite3.OperationalError: # Table might not exist if db_setup wasn't run
            print("Grades table not found. Initializing and seeding...")
            from db_setup import setup_database
            from seed_data import seed_data
            setup_database()
            seed_data()
            print("Database initialized and seeded.")
        finally:
            conn_check.close()


    app.run(debug=True, port=5001) # Running on a different port than default 5000
