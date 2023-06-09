1. Добавить в hosts `127.0.0.1  local.passwords.keremin.ru`

2. Установить nginx

   - `sudo apt update`
   - `sudo apt install nginx`
   - Проверить, что в браузере по адресу `localhost` открывается страница `Welcome to nginx!`

3. Сгенерировать ssl сертификат
   - В терминале выполнить
     ```
     sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout /etc/ssl/private/local.passwords.keremin.ru.key -out /etc/ssl/certs/local.passwords.keremin.ru.crt
     ```
   - Заполнить форму данными
     ```
     Country Name: RU
     State or Province Name: Moscow
     Locality Name: Moscow
     Organization Name: kirilleremin
     Organizational Unit Name: development
     Common Name (e.g. server FQDN or YOUR name): local.passwords.keremin.ru
     Email Address: example@gmail.com
     ```
     
   - В результате должны сгенерироваться сертификаты в 
     - `sudo ls /etc/ssl/private/` 
     - `ls /etc/ssl/certs/`

4. Настроить proxy на frontend и backend

   - `sudo nano /etc/nginx/sites-available/local.passwords.keremin.ru`

     ```
     server {
        listen 443 ssl;
        listen [::]:443 ssl;

        server_name local.passwords.keremin.ru;

        ssl_certificate /etc/ssl/certs/local.passwords.keremin.ru.crt;
        ssl_certificate_key /etc/ssl/private/local.passwords.keremin.ru.key;

        location / {
            proxy_set_header Host $http_host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            proxy_pass https://127.0.0.1:3000;
        }

        location /api {
            proxy_pass http://127.0.0.1:60125;
        }
     }
     ```

   - `sudo ln -s /etc/nginx/sites-available/local.passwords.keremin.ru /etc/nginx/sites-enabled/`

   - Проверить конфигурацию на правильность с помощью команды `sudo nginx -t`

   - Перезапустить nginx `sudo systemctl restart nginx`

5. Запустить frontend и проверить, что оно открывается в браузере по адресу https://local.passwords.keremin.ru

6. Запустить backend и проверить, что оно доступно по адресу https://local.passwords.keremin.ru/api
