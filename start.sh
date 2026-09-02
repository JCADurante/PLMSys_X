#!/usr/bin/env bash

echo "============================================================"
echo "        PLMSys - Plate Lifecycle Monitoring System"
echo "    (Supports Portable Node, Installed Node, & Miniserve)"
echo "============================================================"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

NODE_EXEC=""
MINISERVE_EXEC=""

# 1. Check for Portable node in local directories
if [ -f "./node" ]; then
    NODE_EXEC="./node"
    echo "[OK] Using portable node binary in current directory."
elif [ -f "./bin/node" ]; then
    NODE_EXEC="./bin/node"
    echo "[OK] Using portable node binary in bin/ directory."
elif [ -f "./tools/node" ]; then
    NODE_EXEC="./tools/node"
    echo "[OK] Using portable node binary in tools/ directory."
elif command -v node &> /dev/null; then
    NODE_EXEC="node"
    echo "[OK] Using installed system Node.js: $(node -v)"
fi

# 2. Check for Miniserve
if [ -f "./miniserve" ]; then
    MINISERVE_EXEC="./miniserve"
elif [ -f "./bin/miniserve" ]; then
    MINISERVE_EXEC="./bin/miniserve"
elif [ -f "./tools/miniserve" ]; then
    MINISERVE_EXEC="./tools/miniserve"
elif command -v miniserve &> /dev/null; then
    MINISERVE_EXEC="miniserve"
fi

# 3. If neither Node nor Miniserve is found, inform user
if [ -z "$NODE_EXEC" ] && [ -z "$MINISERVE_EXEC" ]; then
    echo "[ERROR] Neither Node.js nor Miniserve is found on this system."
    echo ""
    echo "Options to run PLMSys:"
    echo "  1. Install Node.js from https://nodejs.org/"
    echo "  2. Download standalone miniserve binary from https://github.com/svenstaro/miniserve/releases"
    echo "  3. Place a standalone node binary in this directory."
    exit 1
fi

# 4. Open browser helper
open_browser() {
    sleep 1
    if command -v xdg-open &> /dev/null; then
        xdg-open "http://localhost:3000" &> /dev/null &
    elif command -v open &> /dev/null; then
        open "http://localhost:3000" &> /dev/null &
    fi
}

# 5. Launch via Miniserve if Node is missing or if requested
if [ -z "$NODE_EXEC" ] && [ -n "$MINISERVE_EXEC" ]; then
    echo "[OK] Starting PLMSys with Miniserve on http://localhost:3000 ..."
    open_browser
    $MINISERVE_EXEC dist --spa --index index.html --port 3000 --interfaces 0.0.0.0
    exit 0
fi

# 6. Launch via Node.js
if [ ! -f "dist/index.html" ]; then
    if [ ! -d "node_modules" ]; then
        echo "[INFO] First time setup detected. Installing dependencies..."
        npm install
        if [ $? -ne 0 ]; then
            echo "[ERROR] Dependency installation failed!"
            exit 1
        fi
    fi
    echo "[INFO] Building dist bundle..."
    npm run build
fi

echo "[INFO] Launching PLMSys Central Server on http://localhost:3000 ..."
open_browser
$NODE_EXEC server.js
