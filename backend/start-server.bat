@echo off
echo 🚀 Starting Ricochet Backend Server...
echo.

start /B npm start
echo ✅ Backend running on http://localhost:3001
echo.
echo ⏳ Waiting for server to start...
timeout /t 3 /nobreak >nul

echo.
echo 🌐 Starting ngrok tunnel...
echo.
echo 📋 IMPORTANT: Copy the HTTPS URL below!
echo    Update frontend/.env.production with this URL
echo    Then run: cd frontend ^&^& npm run build ^&^& npm run deploy
echo.

ngrok http 3001

echo.
echo 🛑 Server stopped
pause
