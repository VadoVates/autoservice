#!/bin/bash

echo -e "Uruchamiam backend\n"
cd backend || exit 1
source venv/bin/activate
uvicorn main:app --host 0.0.0.0 --reload --port 8000 &
BACKEND_PID=$!
cd ..

echo -e "Uruchamiam frontend\n"
cd frontend || exit 2
npm run dev

echo "Zatrzymuję backend (PID $BACKEND_PID)..."
kill $BACKEND_PID
