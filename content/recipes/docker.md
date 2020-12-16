### Dockerize NestJS App

> **Warning** In this article we will not talk about docker and how it works in depth but to see some cases where it can be useful to use. If you don't know Docker stuff you can see [here](https://www.docker.com/get-started)

So you created your first NestJS app and you love using the framework and now you want to show everyone that you can also run it in a Docker container.

Let's start by creating a Docker file in the main folder of our project assuming you need it in a development environment:

```dockerfile
FROM node:latest

WORKDIR /app

COPY ./package.json ./app/package.json

RUN npm install

ADD . /app

VOLUME ["/node_modules"]

VOLUME [ "/src" ]

EXPOSE 3000

CMD ["npm", "run", "start:dev"]
```

> **Warning** This is just an example of Dockerfile there can be many with different characteristics for different development environments in our case and a development environment

Well now to run our NestJS app we launch the following commands from the terminal:

```shell
$ docker build -t nest-app .
$ docker run --name app -p 3000:3000 nest-app
```

#### Docker Compose

Now suppose you want to use docker to pull up a MySQL, PostgreSQL or MongoDB service.

In this docker compose example let's assume we have a NestJS app using TypeORM using MySQL and want to create a docker service for MySQL

```yml
version: "3"

services:
  mysql:
    image: mysql:5
    restart: always
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: test
    ports:
      - "3306:3306"
```

from the terminal we leave the following command:

```shell
$ docker-compose up
```

> info **Hint** If instead we want to launch our container in background mode: `docker-compose up -d`

to terminate our container with the mysql service

```shell
$ docker-compose down
```

> **Warning** This is a simple example docker-compose.yml there can also be many here with different features based on the service you need to use

