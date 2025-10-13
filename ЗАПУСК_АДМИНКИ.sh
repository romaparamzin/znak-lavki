#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки/apps/admin-panel"
nohup pnpm run dev > ../../logs/admin-panel.log 2>&1 &
echo $! > ../../logs/admin-panel.pid
echo "Admin Panel запущен (PID: $(cat ../../logs/admin-panel.pid))"
