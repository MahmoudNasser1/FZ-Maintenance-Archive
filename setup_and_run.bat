@echo off
echo ======================================
echo Maintenance Archive System - Setup and Run
echo ======================================
echo.

REM Create a directory to store log files
if not exist logs mkdir logs

REM ----- PART 1: Setup Backend -----
echo [1/2] Setting up backend server...
cd backend

REM Setup Python virtual environment if not exists
if not exist venv (
    echo Creating virtual environment...
    python -m venv venv
    if %ERRORLEVEL% NEQ 0 (
        echo Error creating virtual environment. Please make sure Python is installed.
        pause
        exit /b 1
    )
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install critical dependencies directly
echo Installing critical dependencies...
pip install python-jose==3.3.0
pip install fastapi==0.104.1
pip install uvicorn==0.24.0
pip install sqlalchemy==2.0.23
pip install pydantic==2.4.2
pip install pydantic-settings==2.0.3
pip install alembic==1.12.1
pip install psycopg2-binary==2.9.9
pip install passlib==1.7.4
pip install python-multipart==0.0.6
pip install python-dotenv==1.0.0

REM Run the migrations
echo Running database migrations...
alembic upgrade head
if %ERRORLEVEL% NEQ 0 (
    echo Warning: Database migration failed. The system may not function properly.
    echo This could be due to PostgreSQL not running or connection issues.
) else (
    echo Database migrations completed successfully.
)

REM Start the backend server
echo Starting backend server...
start "Backend Server" cmd /k "cd %CD% && call venv\Scripts\activate.bat && uvicorn app.main:app --reload --host 0.0.0.0 --port 8000"
echo Backend server started on port 8000.
echo.

REM ----- PART 2: Setup Frontend -----
echo [2/2] Setting up frontend server...
cd ..\frontend

REM Start the frontend development server
echo Starting frontend server...
start "Frontend Server" cmd /k "cd %CD% && npm start"
echo Frontend server started on port 3000.
echo.

REM Return to the root directory
cd ..

echo ======================================
echo Setup completed!
echo ======================================
echo.
echo The system is now running:
echo - Frontend: http://localhost:3000
echo - Backend API: http://localhost:8000
echo - API Documentation: http://localhost:8000/docs
echo.
echo To test QR Code offline features:
echo - Navigate to: http://localhost:3000/offline-qr
echo.
echo Press any key to close this window...
pause > nul
