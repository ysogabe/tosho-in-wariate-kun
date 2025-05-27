# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

**Port Configuration**:

- Production: Frontend runs on port 3200, Backend runs on port 5200
- Testing: Use port 3000 + issue number for frontend, 5000 + issue number for backend (e.g., issue #011: frontend 3011, backend 5011)

### Frontend (Next.js)

```bash
cd frontend
npm run dev           # Start development server on port 3200
npm run build         # Build for production
npm run lint          # Run ESLint
```

### Mock Backend (Python Flask)

**Important**: When executing Python commands in the mock_backend directory, always ensure the virtual environment is activated first:

```bash
cd mock_backend
python -m venv venv && source venv/bin/activate  # Setup virtual environment (first time only)
source venv/bin/activate                          # Activate venv (every new session)
pip install -r requirements.txt                   # Install dependencies
python init_database.py                           # Initialize SQLite database
python app.py                                     # Start Flask server on port 5200
```

### Testing

**Test Port Configuration**: When running tests for a specific issue, use:

- Frontend: `PORT=3XXX` where XXX is the issue number (e.g., `PORT=3011` for issue #011)
- Backend: Configure to run on port `5XXX` where XXX is the issue number (e.g., port 5011 for issue #011)

```bash
# Backend tests (run from mock_backend/)
pytest --cov=. --cov-report=html                 # Unit/integration tests with coverage
pytest -m "not slow"                             # Skip slow tests
pytest tests/test_api_classes.py                 # Run specific test file

# E2E tests (run from project root)
npm test                                          # Run Playwright tests
npm run test:ui                                   # Run tests with UI
npm run test:debug                                # Debug mode

# Example: Running tests for issue #011
PORT=3011 npm run dev                             # Frontend on port 3011
# In app.py, configure: app.run(port=5011)       # Backend on port 5011
```

## Project Architecture

This is a library committee duty assignment system (図書委員当番くん) with a 3-tier architecture:

### Frontend Structure

- **Framework**: Next.js 15 with App Router, React 19, TypeScript
- **Styling**: TailwindCSS with custom components in `src/components/ui/`
- **State Management**: React Context API (`SchoolContext`) + localStorage for school name
- **API Layer**: Centralized API service in `src/services/api.ts` connecting to Flask backend
- **Layout**: Shared layout with Japanese font (Noto Sans JP) and responsive design

### Backend Structure

- **Framework**: Python Flask with CORS enabled, running on port 5200
- **Database**: SQLite with tables for grades, classes, committee_members, libraries, schedules, schedule_assignments
- **Core Feature**: Schedule generator engine in `schedule_generator.py` for automatic duty assignment
- **API**: RESTful endpoints following pattern `/api/{resource}` with CRUD operations

### Key Data Flow

1. Frontend components use hooks to call API functions from `api.ts`
2. API service sends HTTP requests to Flask backend at localhost:5200
3. Flask routes interact with SQLite database and schedule generation engine
4. School name is managed globally via SchoolContext and persisted to localStorage

## Development Guidelines

### Workflow Guidelines

1. **Before starting work**: Create a feature branch with an issue number

   ```bash
   git checkout -b feature/###-feature-description  # e.g., feature/011-fix-library-api
   ```

2. **For bug fixes**: Create fix branches from the relevant feature branch, NOT from main

   ```bash
   # First, checkout the feature branch that has the bug
   git checkout feature/002-school-position-api
   
   # Then create a fix branch from it
   git checkout -b fix/###-bug-description  # e.g., fix/012-library-api-error
   
   # When done, merge back to the feature branch, NOT main
   git checkout feature/002-school-position-api
   git merge fix/012-library-api-error
   ```

3. **During work**: Follow the development guidelines below for your specific area

4. **After completing work**: Update the corresponding issue file in the `issues/` directory
   - Add implementation details, test results, and any relevant notes
   - Mark the issue as resolved with completion date
   - Document any remaining tasks or follow-up items

### Database Operations

- Database file is `mock_backend/database.db`
- Always run `python init_database.py` after schema changes
- Use `get_db_connection()` helper function for database access
- Test database operations with `pytest tests/test_actual_db.py`

### Schedule Generation

- Core algorithm is in `schedule_generator.py` with `ScheduleGenerator` class
- Supports constraints like fixed class assignments and balanced distribution
- Test schedule generation with dedicated test files in `tests/test_schedule_generator*.py`

### Frontend Components

- Page components are in `src/app/` following App Router structure
- Reusable UI components are in `src/components/ui/`
- Use SchoolContext for accessing/updating school name across components
- API calls should be made through the centralized `api.ts` service

### Testing Strategy

- Backend: Pytest with markers (unit, integration, api, slow)
- Frontend: Playwright E2E tests in `e2e/specs/`
- Test data fixtures are in `e2e/fixtures/` and backend seed data via `seed_data.py`
- Coverage reports generated in `mock_backend/htmlcov/`

### Code Style

- Frontend: ESLint with Next.js configuration
- Backend: Uses pytest.ini configuration with verbose output and strict markers
- Both codebases use TypeScript/Python type hints for better maintainability

## Test Port Configuration

**Important Rule**: When testing for a specific issue, use port numbers based on the issue number:

- Frontend: Port 3000 + Issue Number (e.g., Issue #011 → Port 3011)
- Backend: Port 5000 + Issue Number (e.g., Issue #011 → Port 5011)

### Example: Testing Issue #011

```bash
# Frontend (from frontend/)
PORT=3011 npm run dev
# Or
npx next dev --port 3011

# Backend (from mock_backend/)
source venv/bin/activate
python app.py --port 5011
# Or
FLASK_APP=app.py python -m flask run --port=5011

# Update API configuration
# In frontend/src/services/api.ts:
# const API_BASE_URL = 'http://localhost:5011/api';
```

This port configuration ensures that:

- Each issue has its own isolated testing environment
- Multiple issues can be tested simultaneously without port conflicts
- It's easy to identify which ports belong to which issue
