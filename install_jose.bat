@echo off
echo ======================================
echo Installing python-jose package
echo ======================================
echo.

cd backend
call venv\Scripts\activate.bat

echo Installing python-jose package directly...
pip install python-jose==3.3.0
pip install pyjwt==2.6.0
pip install cryptography==40.0.2

echo.
echo Installation completed!
echo.
echo Now you can run the server using setup_and_run.bat
echo.
pause
