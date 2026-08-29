#!/usr/bin/env bash

echo "============================================================"
echo "        PLMSys - Plate Lifecycle Monitoring System"
echo "============================================================"
echo ""

if ! command -v node &> /dev/null; then
    echo "[ERROR] Node.js is not installed."
    echo "Please install Node.js (v18+) from https://nodejs.org/"
    exit 1
fi

if [ ! -d "node_modules" ]; then
    echo "[INFO] First time setup detected. Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "[ERROR] Dependency installation failed!"
        exit 1
    fi
fi

echo "[INFO] Launching PLMSys on http://localhost:3000 ..."

# Attempt to open browser based on OS
if command -v xdg-open &> /dev/null; then
    (sleep 2 && xdg-open "http://localhost:3000") &
elif command -v open &> /dev/null; then
    (sleep 2 && open "http://localhost:3000") &
fi

npm run dev
