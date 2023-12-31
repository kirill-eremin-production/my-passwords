# Локальный запуск docker контейнера при разработке

Такой способ запуска полезен для отладки в процессе разработки (чтобы проверить, что docker образ запускается и работает правильно)

---

1. SSL сертификат можно сгенерировать с помощью openssl

   - см. пример в [proxy.md](../dev/proxy.md)

     ```
     sudo openssl req -x509 -nodes -days 3650 -newkey rsa:2048 -keyout ./nginx/ssl/privkey.pem -out ./nginx/ssl/fullchain.pem
     ```

     **Сертификат сгенерируется в текущей папочке**

     **Предполагается, что вы находитесь в корне проекта**

---

2. Nginx внутри Docker должен иметь доступ на чтение сертификата. Т.е. нужно проверить, что `key.pem` и `cert.pem` доступны на чтение. При необходимости права можно поменять с помощью `chmod 644 ./filename`

   - [chmod-calculator](https://chmod-calculator.com/)

---

3. В корне проекта создать env файл с необходимыми переменными окружения. См. пример в `backend/.env.example`

---

4. В таком случае контейнер надо запускать так

   ```
   docker run -p 8080:443 -v ./nginx/ssl:/usr/src/app/ssl -v ./store:/usr/src/app/store --env-file ./env -d keremin/my-passwords:0.1.0
   ```

   - Параметры запуска:

     - `-v ./store:/usr/src/app/store` - данные приложения сохраняются в host системе, чтобы не удалялись между перезапусками docker-контейнера

---

5. Приложение должно стать доступным по адресу https://local.passwords.keremin.ru:8080/
