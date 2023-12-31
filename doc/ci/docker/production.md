# Запуск docker контейнера на сервере

**Домен уже должен быть готов и настроен**

1. Усановить certbot `apt install certbot`

2. Сгенерировать сертификат `certbot certonly -d <domain>`

   - Сгенерируется два файла:
     `/etc/letsencrypt/live/<domain>/fullchain.pem`
     `/etc/letsencrypt/live/<domain>/privkey.pem`

3. Запустить docker образ
   - `docker run -p 443:443 -v /etc/letsencrypt/live/my-passwords.keremin.ru:/usr/src/app/ssl -v /etc/letsencrypt/archive:/usr/src/archive -v ./store:/usr/src/app/store --env-file ./env -d keremin/my-passwords`
   - Certbot генерирует сертификат в `/etc/letsencrypt/archive` и симлинки кладет в `/etc/letsencrypt/live` поэтому в Docker Valume еще надо передавать `archive`, чтобы nginx мог использовать реальные файлы сертификатов
   - В файл ./env файле указываем необходимые переменные окружения
