1. Добавить в hosts `127.0.0.1  local.passwords.keremin.ru`

2. Установить nginx

   - `sudo apt update`
   - `sudo apt install nginx`
   - Проверить, что в браузере по адресу `localhost` открывается страница `Welcome to nginx!`

3. Настроить proxy на frontend и backend

   - `sudo nano /etc/nginx/sites-available/local.passwords.keremin.ru`

     ```
     server {
        listen 80;
        listen [::]:80;

        server_name local.passwords.keremin.ru;

        location / {
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_pass http://127.0.0.1:3000;
        }

        location /api {
            proxy_pass http://127.0.0.1:60125;
        }
     }
     ```

   - `sudo ln -s /etc/nginx/sites-available/local.passwords.keremin.ru /etc/nginx/sites-enabled/`

   - Проверить конфигурацию на правильность с помощью команды `sudo nginx -t`

   - Перезапустить nginx `sudo systemctl restart nginx`

4. Запустить frontend и проверить, что оно открывается в браузере по адресу http://local.passwords.keremin.ru

5. Запустить backend и проверить, что оно доступно по адресу http://local.passwords.keremin.ru/api
