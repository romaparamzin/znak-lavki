#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && . "$NVM_DIR/nvm.sh"
cd "/Users/rparamzin/Desktop/репозиторий/Знак лавки"
nohup pnpm run dev > logs/backend.log 2>&1 &
echo $! > logs/backend.pid
echo "Backend запущен (PID: $(cat logs/backend.pid))"
