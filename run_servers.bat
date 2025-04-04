@echo off
echo ======================================
echo Maintenance Archive System - Starting Servers
echo ======================================
echo.

echo [1/5] Setting up backend development environment...
cd backend
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
)
call venv\Scripts\activate.bat
echo Installing dependencies...
pip install -r requirements.txt
echo.

echo [2/5] Migrating database...
alembic upgrade head
echo.

echo [3/5] Inserting sample data...
python -m seed.seed_data
echo.

echo [4/5] Starting backend server...
start cmd /k "cd backend && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo Backend server started on port 8000
echo.

echo [5/5] Starting frontend server...
cd ..\frontend
echo Installing dependencies...
npm install --legacy-peer-deps
echo.
start cmd /k "cd frontend && npm start"
echo Frontend server started on port 3000
echo.

echo ======================================
echo System started successfully!
echo ======================================
echo.
echo Links:
echo - User Interface: http://localhost:3000
echo - API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.
echo Press any key to exit...
pause > nul
