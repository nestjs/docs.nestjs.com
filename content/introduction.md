### Introducción

Nest (NestJS) es un framework de aplicaciones de servidor eficientes y escalables escrito en [Node.js](https://nodejs.org/). utilizando JavaScript progresivo, está construido con soporte completo para [TypeScript](http://www.typescriptlang.org/) (y sí aun se puede escribir código en JavaScript puro) y combina elementos de POO (Programación Orientada a Objetos), PF (Programación Funcional), PFR (Programación Funcional Reactiva).

Nest utiliza robustos framework de servidor HTTP tales como [Express](https://expressjs.com/) (por defecto) y opcionalmente también puede ser configurado para utilizar [Fastify](https://github.com/fastify/fastify).

Nest entrega un nivel de abstracción sobre estos frameworks Node.js (Express/Fastify), aunque también expone sus API directamente a los desarrolladores. Esto entrega a los desarrolladores la libertad de usar los numerosos modulos de terceros disponibles para estas plataformas.

#### Filosofía

En los últimos años, gracias a Node.js, JavaScript se ha vuelto la “lingua franca” de la web, para aplicaciones front y backend. Esto ha hecho emerger grandes proyectos como [Angular](https://angular.io/), [React](https://github.com/facebook/react) y [Vue](https://github.com/vuejs/vue), Los cuales han mejorada la productividad de los desarrolladores y aumentado la creación de aplicaciones de frontend rapidas, testeables y extensibles, a pesar de gran cantidad de magnificas librerias y herramientas existentes para Node (y JavaScript del lado del servidor), ninguna de ellas soluciona de forma efectiva el problema de la - **Architecture**.

Nest provee una arquitectura para aplicaciones lista para usar, que permite a los desarrolladores y equipos crear aplicaciones altamente testeables, escalables, poco acopladas y facilmente mantenibles. La arquitectura esta altamente inspirada en [Angular](https://angular.io/).

#### Instalación

Para comenzar, tu puedes crear el proyecto por ti mismo con el [CLI de Nest](/cli/overview), o clonar un proyecto inicial (Ambos producen el mismo resultado).

Para crear un proyecto con el [CLI de Nest](/cli/overview), ejecuta los siguientes comandos. Esto creara un directorio para el proyecto, y copiara los archivos iniciales del core de Nest y los módulos necesarios, y creara la estructura base de directorios. Crear un proyecto utilizando el **CLI de Nest** se recomienda para nuevos usuarios. Continuaremos con este enfoque en los [Primeros pasos](first-steps).

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **Tip** Para crear un nuevo proyecto con el modo [estricto](https://www.typescriptlang.org/tsconfig#strict) de TypeScript habilitado, pasa el modificador `--strict` al comando `nest new`.

#### Alternativas

Alternativamente, para instalar el proyecto inicial con TypeScript con **Git**:


```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **Tip** Si quieres clonar el repositorio sin el historial de git, puedes utilizar [degit](https://github.com/Rich-Harris/degit).

Abre el navegador y apunta a [`http://localhost:3000/`](http://localhost:3000/).

Para instalar el proyecto inicial versión JavaScript usa `javascript-starter.git` en el comando anterior.

También puedes crear un proyecto desde cero, instalando los archivos core y de soporte con **npm** (o **yarn**). en este caso tendras que crear todos los archivos iniciales por ti mismo.

```bash
$ npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata
```
