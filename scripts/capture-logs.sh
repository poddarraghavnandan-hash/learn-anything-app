#!/bin/bash

# Real-time server log capture script
# Captures all server output to timestamped log files

LOG_DIR="/home/ubuntu/learn-anything/logs"
mkdir -p "$LOG_DIR"

# Create timestamped log file
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
LOG_FILE="$LOG_DIR/server-$TIMESTAMP.log"

# Capture all output to log file and console
echo "=== Shiro Server Logs ===" > "$LOG_FILE"
echo "Start Time: $(date)" >> "$LOG_FILE"
echo "Node Version: $(node --version)" >> "$LOG_FILE"
echo "NPM Version: $(npm --version)" >> "$LOG_FILE"
echo "=========================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Run dev server and capture output
cd /home/ubuntu/learn-anything
npm run dev 2>&1 | tee -a "$LOG_FILE"

# Append end time
echo "" >> "$LOG_FILE"
echo "End Time: $(date)" >> "$LOG_FILE"
