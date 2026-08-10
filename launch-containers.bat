@echo off
echo Starting Laxmi Enterprise Containers...
echo.

REM Stop any existing containers
docker-compose down

REM Build and start all containers
docker-compose up --build

echo.
echo Laxmi Enterprise containers started successfully!
echo.
echo Access the applications:
echo - Supervisor App: http://localhost:5173
echo - Admin App: http://localhost:5174
echo - Backend API: http://localhost:8000
echo.
echo To stop the containers, run: docker-compose down
