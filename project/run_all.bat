@echo off
title Smart Healthcare Management System — Launcher
color 0A

echo.
echo  ====================================================
echo   Smart Healthcare Management System — Startup
echo  ====================================================
echo.

:: ─── Step 1: Start Node.js Backend (fast, ~3 seconds) ───
echo [1/3] Starting Node.js Backend (Port 3001)...
start "Healthcare API — Port 3001" cmd /k "cd backend && npm install && node server.js"
timeout /t 5 /nobreak >nul

:: ─── Step 2: Start ML Backend (slow — generates data, trains models, then starts) ───
echo [2/3] Starting ML Backend (Port 8000)...
echo       This may take 2-3 minutes (dataset generation + model training + graph generation)...
start "ML Backend — Port 8000" cmd /k "cd ml-backend && pip install -r requirements.txt && python generate_datasets.py && python train_models.py && python visualizations.py && uvicorn main:app --reload --port 8000"
timeout /t 8 /nobreak >nul

:: ─── Step 3: Start Frontend (medium, ~5 seconds) ───
echo [3/3] Starting React Frontend (Port 5173)...
start "Frontend — Port 5173" cmd /k "cd frontend && npm install && npm run dev"

echo.
echo  ====================================================
echo   All services are starting in separate windows!
echo  ====================================================
echo.
echo   Frontend:    http://localhost:5173
echo   Node.js API: http://localhost:3001/api/health
echo   ML Backend:  http://localhost:8000/health
echo.
echo   NOTE: The ML backend takes 2-3 minutes to start.
echo         The frontend will show health indicators when
echo         each backend becomes available.
echo  ====================================================
echo.
pause
