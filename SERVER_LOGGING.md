# Shiro Server Logging System

**Purpose:** Capture all server logs in real-time for debugging, monitoring, and audit trails.

---

## 1. Logging Architecture

### 1.1 Log Capture Methods

| Method | Purpose | Command |
|--------|---------|---------|
| **Real-time Console** | Live monitoring during development | `npm run dev` |
| **File Capture** | Persistent log storage | `npm run dev 2>&1 \| tee logs/server-TIMESTAMP.log` |
| **Automated Script** | Scheduled logging with metadata | `./scripts/capture-logs.sh` |
| **Git Commit** | Version-controlled log history | `git add logs/` && `git commit` |

### 1.2 Log Directory Structure

```
/home/ubuntu/learn-anything/logs/
├── server-20260403-012553.log      # Timestamped session logs
├── server-20260403-013000.log
├── server-20260403-014500.log
└── ...
```

---

## 2. Server Log Capture

### 2.1 Real-time Logging

**Start dev server with real-time log capture:**

```bash
cd /home/ubuntu/learn-anything
npm run dev 2>&1 | tee logs/server-$(date +%Y%m%d-%H%M%S).log
```

**What gets captured:**
- ✅ Metro bundler output
- ✅ tRPC server startup messages
- ✅ Database connection logs
- ✅ API request/response logs
- ✅ Error messages and stack traces
- ✅ Performance metrics
- ✅ Webpack/build warnings

### 2.2 Automated Logging Script

**Run the automated logging script:**

```bash
./scripts/capture-logs.sh
```

**Features:**
- ✅ Automatically creates timestamped log file
- ✅ Captures Node.js and NPM versions
- ✅ Records start/end times
- ✅ Outputs to both console and file
- ✅ Preserves full output for analysis

### 2.3 Log File Format

Each log file contains:

```
=== Shiro Server Logs ===
Start Time: Thu Apr 03 2026 01:25:53 GMT+0000
Node Version: v22.13.0
NPM Version: 10.x.x
=========================

[Server startup messages...]
[API request logs...]
[Error messages...]
[Performance metrics...]

End Time: Thu Apr 03 2026 01:30:00 GMT+0000
```

---

## 3. Monitoring Key Signals

### 3.1 Server Startup

**Expected output:**
```
[0] > shiro@1.0.0 dev:server
[0] > cross-env NODE_ENV=development tsx watch server/_core/index.ts
[0] [tsx] Watching for changes in /home/ubuntu/learn-anything/server
[0] Server listening on port 3000
```

### 3.2 Metro Bundler

**Expected output:**
```
[1] Starting project at /home/ubuntu/learn-anything
[1] React Compiler enabled
[1] Starting Metro Bundler
[1] EXPO_USE_METRO_WORKSPACE_ROOT is enabled by default
```

### 3.3 API Endpoints

**Expected output:**
```
[0] tRPC router initialized
[0] Routes available:
[0]   - claudeContent.generateLessonContent
[0]   - behaviorTracking.recordSignal
[0]   - spacedRepetition.getReviewItems
[0]   - baselineEvaluation.evaluateUser
```

### 3.4 Error Detection

**Watch for:**
- ❌ `ELIFECYCLE` - Process exit errors
- ❌ `TypeError` - Runtime errors
- ❌ `Cannot find module` - Missing dependencies
- ❌ `Port already in use` - Port conflicts
- ❌ `ECONNREFUSED` - Database connection failures

---

## 4. Log Analysis

### 4.1 View Recent Logs

```bash
# View latest log file
tail -f logs/server-*.log

# View last 50 lines
tail -50 logs/server-*.log

# Search for errors
grep -i "error\|warn\|fail" logs/server-*.log
```

### 4.2 Performance Analysis

```bash
# Search for performance metrics
grep -i "duration\|latency\|ms" logs/server-*.log

# Count API calls
grep -c "POST\|GET\|PUT\|DELETE" logs/server-*.log
```

### 4.3 Debugging Issues

```bash
# Find specific error
grep -A 5 "TypeError" logs/server-*.log

# Track user session
grep "user-id-123" logs/server-*.log

# Monitor API latency
grep "generateLessonContent" logs/server-*.log
```

---

## 5. Git Integration

### 5.1 Commit Logs to Main Branch

**Add all logs to git:**

```bash
cd /home/ubuntu/learn-anything
git add logs/
git commit -m "logs: Capture server logs from session $(date +%Y%m%d-%H%M%S)"
git push origin main
```

### 5.2 Log Retention Policy

- **Keep:** Last 30 days of logs
- **Archive:** Older logs moved to `logs/archive/`
- **Cleanup:** Run `./scripts/cleanup-logs.sh` weekly

### 5.3 .gitignore Configuration

```gitignore
# Logs directory (optional - set based on policy)
# logs/
# logs/*.log

# Or keep logs and ignore only large files
logs/*.log
!logs/README.md
```

---

## 6. Real-time Monitoring Dashboard

### 6.1 Log Streaming

**Stream logs to monitoring service:**

```bash
# Option 1: Tail in real-time
tail -f logs/server-*.log

# Option 2: Watch with grep filter
tail -f logs/server-*.log | grep -i "error\|warn"

# Option 3: Monitor specific service
tail -f logs/server-*.log | grep "claudeContent"
```

### 6.2 Log Aggregation

**For production, integrate with:**
- ELK Stack (Elasticsearch, Logstash, Kibana)
- Datadog
- New Relic
- CloudWatch (AWS)
- Stackdriver (Google Cloud)

---

## 7. Troubleshooting

### 7.1 Port Already in Use

**Error:**
```
Port 8081 is running this app in another window
```

**Solution:**
```bash
# Kill process on port 8081
lsof -ti:8081 | xargs kill -9

# Or use different port
EXPO_PORT=8082 npm run dev
```

### 7.2 Database Connection Failed

**Error:**
```
ECONNREFUSED 127.0.0.1:5432
```

**Solution:**
```bash
# Check database status
psql -U postgres -d learn_anything -c "SELECT 1"

# Restart database
sudo systemctl restart postgresql
```

### 7.3 Missing Dependencies

**Error:**
```
Cannot find module '@/lib/utils'
```

**Solution:**
```bash
# Reinstall dependencies
npm install
# or
pnpm install
```

---

## 8. Log Retention & Cleanup

### 8.1 Automatic Cleanup Script

**Create `scripts/cleanup-logs.sh`:**

```bash
#!/bin/bash

# Keep logs from last 30 days
DAYS=30
LOG_DIR="/home/ubuntu/learn-anything/logs"

find "$LOG_DIR" -name "server-*.log" -mtime +$DAYS -delete
echo "✅ Cleaned up logs older than $DAYS days"
```

### 8.2 Schedule Cleanup (Cron)

```bash
# Run cleanup weekly (Sunday at 2 AM)
0 2 * * 0 /home/ubuntu/learn-anything/scripts/cleanup-logs.sh
```

---

## 9. Log Metrics

### 9.1 Key Metrics to Track

| Metric | Purpose | Example |
|--------|---------|---------|
| **API Latency** | Response time | `generateLessonContent: 1250ms` |
| **Error Rate** | Failure percentage | `5 errors / 1000 requests = 0.5%` |
| **Throughput** | Requests per second | `100 req/s` |
| **Memory Usage** | RAM consumption | `Memory: 250MB / 1GB` |
| **CPU Usage** | Processor load | `CPU: 45%` |

### 9.2 Health Check

```bash
# Check server health
curl -s http://localhost:3000/health | jq .

# Expected response:
# {
#   "status": "ok",
#   "uptime": 3600,
#   "memory": "250MB",
#   "cpu": "45%"
# }
```

---

## 10. Best Practices

✅ **DO:**
- Capture logs for all server sessions
- Commit logs to git for audit trail
- Monitor error rates and latency
- Rotate logs regularly
- Archive old logs for compliance

❌ **DON'T:**
- Leave sensitive data in logs
- Commit logs with passwords/API keys
- Store logs indefinitely
- Ignore error patterns
- Mix production and dev logs

---

## 11. Next Steps

1. **Implement Log Aggregation** — Set up ELK Stack or Datadog for centralized monitoring
2. **Add Structured Logging** — Use Winston or Pino for JSON-formatted logs
3. **Create Alerts** — Set up alerts for error thresholds and anomalies
4. **Build Dashboard** — Create real-time monitoring dashboard with Grafana
5. **Document Runbooks** — Create troubleshooting guides for common errors

---

**Last Updated:** April 3, 2026  
**Status:** ✅ Active Logging System  
**Next Review:** April 10, 2026
