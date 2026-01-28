@echo off

REM Terminal 1: Backend
start "Backend" cmd /k "cd backend && npm run dev"

REM Terminal 2: Web Frontend
start "Web Frontend" cmd /k "cd frontend-web && npm run dev"

REM Terminal 3: Mobile Frontend
start "Mobile Frontend" cmd /k "cd frontend-mobile && npm start"
