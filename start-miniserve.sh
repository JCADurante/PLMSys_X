#!/usr/bin/env bash

echo "============================================================"
echo "    PLMSys - Miniserve Zero-Install LAN / Offline Server"
echo "           (Latest Miniserve v0.35.0 Engine)"
echo "============================================================"
echo ""

PORT=3000
BUNDLE_DIR="dist"
MINISERVE_BIN="./miniserve"

# 1. Check if miniserve binary exists or is in PATH
if [ -f "$MINISERVE_BIN" ]; then
    RUN_BIN="$MINISERVE_BIN"
elif command -v miniserve &> /dev/null; then
    RUN_BIN="miniserve"
else
    echo "[INFO] miniserve binary not found in PATH or directory."
    echo "[INFO] Attempting to download latest miniserve v0.35.0..."
    
    OS=$(uname -s | tr '[:upper:]' '[:lower:]')
    ARCH=$(uname -m)
    
    if [ "$OS" = "linux" ]; then
        URL="https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-unknown-linux-musl"
    elif [ "$OS" = "darwin" ]; then
        if [ "$ARCH" = "arm64" ]; then
            URL="https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-aarch64-apple-darwin"
        else
            URL="https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-apple-darwin"
        fi
    else
        URL="https://github.com/svenstaro/miniserve/releases/download/v0.35.0/miniserve-v0.35.0-x86_64-unknown-linux-musl"
    fi
    
    if command -v curl &> /dev/null; then
        curl -L -o miniserve "$URL"
        chmod +x miniserve
        RUN_BIN="./miniserve"
    elif command -v wget &> /dev/null; then
        wget -O miniserve "$URL"
        chmod +x miniserve
        RUN_BIN="./miniserve"
    else
        echo "[ERROR] curl or wget required for automatic download."
        echo "Please download miniserve from https://github.com/svenstaro/miniserve/releases/latest"
        exit 1
    fi
fi

# 2. Check if dist/ folder exists with production assets
if [ ! -f "$BUNDLE_DIR/index.html" ]; then
    echo "[INFO] Production bundle '$BUNDLE_DIR' not found."
    echo "[INFO] Building production bundle using npm..."
    npm run build
    if [ $? -ne 0 ]; then
        echo "[ERROR] Production build failed!"
        exit 1
    fi
fi

echo ""
echo "============================================================"
echo " Starting Miniserve on http://localhost:$PORT"
echo "============================================================"
echo ""

# Attempt to open browser based on OS
if command -v xdg-open &> /dev/null; then
    (sleep 1 && xdg-open "http://localhost:$PORT") &
elif command -v open &> /dev/null; then
    (sleep 1 && open "http://localhost:$PORT") &
fi

echo "[SERVER ACTIVE] Press Ctrl+C in this terminal to stop miniserve."
echo ""
"$RUN_BIN" --spa --index index.html --port "$PORT" --interfaces 0.0.0.0 "$BUNDLE_DIR"
