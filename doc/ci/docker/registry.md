# Работа с docker registry для этого приложения

https://hub.docker.com/r/keremin/my-passwords

1. Собрать backend и frontend

   - Из корня проекта запустить `sh ./build.sh`

2. Собрать docker образ

   - Версию приложения см. в файле `version.json` - она должна совпадать с версией `backend` и `frontend`
   - Из корня проекта запустить `docker build . -t keremin/my-passwords:0.1.0`

3. Запушить `docker push keremin/my-passwords:latest`

   - Перед этим надо авторизоваться или `docker login` или в Docker Desktop

4. Запулить `docker pull keremin/my-passwords:latest`
   - Авторизация не требуется
