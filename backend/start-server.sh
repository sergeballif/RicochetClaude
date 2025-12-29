#!/bin/bash

echo "🚀 Starting Ricochet Backend Server..."
echo ""

# Start backend in background
npm start &
BACKEND_PID=$!

echo "✅ Backend running on http://localhost:3001"
echo ""
echo "⏳ Waiting 3 seconds for server to start..."
sleep 3

echo ""
echo "🌐 Starting ngrok tunnel..."
echo ""
echo "📋 IMPORTANT: Copy the HTTPS URL below!"
echo "   Update frontend/.env.production with this URL"
echo "   Then run: cd frontend && npm run build && npm run deploy"
echo ""

# Start ngrok (will show URL in terminal)
ngrok http 3001

# When ngrok stops (Ctrl+C), kill backend
kill $BACKEND_PID
echo ""
echo "🛑 Server stopped"
