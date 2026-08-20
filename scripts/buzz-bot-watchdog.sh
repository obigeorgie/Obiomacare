#!/usr/bin/env bash
# Watchdog: ensure the Atlas Buzz bot process is running; restart if dead.
# Healthy (bot running) => exit 0 with no output (cron no_agent = silent).
cd /data/workspace/buzz-bot || exit 1
if pgrep -f "node bot.mjs" >/dev/null 2>&1; then
  exit 0
fi
echo "[$(date -Is)] watchdog: bot not running — starting"
nohup ./run.sh >> watchdog.log 2>&1 < /dev/null &
exit 0
