#!/bin/bash

# Убиваем все запущенные nodejs процессы
killall node;

# Запускаем nginx
service nginx start;

# Запускаем backend
node ./backend/index.js
