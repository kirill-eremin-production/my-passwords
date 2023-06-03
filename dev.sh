#!/bin/bash

# Убиваем все запущенные nodejs процессы
killall node;

# Запускаем backend и frontend параллельно
(cd ./backend && npm run dev) & (cd ./frontend && npm run start)