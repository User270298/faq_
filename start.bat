@echo off
echo Starting FAQ System...
echo.

echo Starting Backend...
cd backend
start "Backend" cmd /k "python run.py"

echo.
echo Starting Frontend...
cd ..\frontend
start "Frontend" cmd /k "npm run dev"

echo.
echo FAQ System is starting...
echo Backend: http://localhost:8000
echo Frontend: http://localhost:3000
echo.
echo Press any key to exit...
pause >nul 