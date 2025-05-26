# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Frontend (Next.js)
```bash
cd frontend
npm run dev           # Start development server with Turbopack
npm run build         # Build for production
npm run lint          # Run ESLint
```

### Mock Backend (Python Flask)
```bash
cd mock_backend
python -m venv venv && source venv/bin/activate  # Setup virtual environment
pip install -r requirements.txt                   # Install dependencies
python init_database.py                           # Initialize SQLite database
python app.py                                     # Start Flask server on port 5001
```

### Testing
```bash
# Backend tests (run from mock_backend/)
pytest --cov=. --cov-report=html                 # Unit/integration tests with coverage
pytest -m "not slow"                             # Skip slow tests
pytest tests/test_api_classes.py                 # Run specific test file

# E2E tests (run from project root)
npm test                                          # Run Playwright tests
npm run test:ui                                   # Run tests with UI
npm run test:debug                                # Debug mode
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
- **Framework**: Python Flask with CORS enabled, running on port 5001
- **Database**: SQLite with tables for grades, classes, committee_members, libraries, schedules, schedule_assignments
- **Core Feature**: Schedule generator engine in `schedule_generator.py` for automatic duty assignment
- **API**: RESTful endpoints following pattern `/api/{resource}` with CRUD operations

### Key Data Flow
1. Frontend components use hooks to call API functions from `api.ts`
2. API service sends HTTP requests to Flask backend at localhost:5001
3. Flask routes interact with SQLite database and schedule generation engine
4. School name is managed globally via SchoolContext and persisted to localStorage

## Development Guidelines

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