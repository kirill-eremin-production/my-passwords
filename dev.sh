#!/bin/bash

# Убиваем все запущенные nodejs процессы
killall node;

# Запускаем backend
echo "Запускаем backend..."
cd ./backend && npm run start:dev &

# Ждем пока backend не станет доступен на порту 60125
echo "Ожидание запуска backend..."
until nc -z localhost 60125 2>/dev/null; do
    sleep 1
    echo "Проверяем доступность backend..."
done

echo "Backend запущен! Запускаем frontend..."

# Запускаем frontend
cd ./frontend && npm run dev