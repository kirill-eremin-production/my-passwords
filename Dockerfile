FROM node:18

# Устанавливаем nginx
RUN apt update && apt install nginx -y
# Копируем конфиг для nginx
COPY ./nginx/docker-config /etc/nginx/sites-available/passwords.keremin.ru
# Создаем symlink в sites-enabled, проверяем конфигурацию и перезапускаем nginx
RUN ln -s /etc/nginx/sites-available/passwords.keremin.ru /etc/nginx/sites-enabled/ && rm /etc/nginx/sites-enabled/default

# ------------ BACKEND ------------
# Создаем папочку для backend-а
WORKDIR /usr/src/app/backend

# Копируем package.json и package-lock.json
COPY ./backend/package*.json ./
# Устанавливаем зависимости
RUN npm ci --omit=dev

# Копируем собранное приложение
COPY ./backend/dist .

# ------------ FRONTEND ------------
# Создаем папочку для frontend-а
WORKDIR /usr/src/app/frontend

# Копируем package.json и package-lock.json
COPY ./backend/package*.json ./
# Устанавливаем зависимости
RUN npm ci --omit=dev

# Копируем собранное приложение
COPY ./frontend/build .

# ------------ APP ROOT ------------
# Переходим в корневую папочку приложения
WORKDIR /usr/src/app

# Копируем скрипт запуска приложения
COPY ./docker.sh ./start.sh
# Делаем файл исполняемым
RUN chmod 744 start.sh

EXPOSE 80

CMD [ "sh", "./start.sh" ]