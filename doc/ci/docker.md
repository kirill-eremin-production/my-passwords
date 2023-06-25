[Dockerizing a Node.js web app](ttps://nodejs.org/en/docs/guides/nodejs-docker-webapp)

# Шпаргалка по докеру
- `docker ps -a` - список контейнеров
- `docker images` - список образов
- `docker rm` - удалить контейнер
- `docker rmi` - удалить образ
- `docker build . -t kirilleremin/my-passwords` - собрать образ
- `docker run -p <your-port>:<app-port> -d kirilleremin/my-passwords` - запустить контейнер
- `docker logs <container id>` - посмотреть логи контейнера
- `docker exec -it <container id> /bin/bash` - подключиться к контейнеру
- `docker kill <container id>` - остановить контейнер