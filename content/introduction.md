### 소개

Nest는 효과적이고, 확장가능한 [Node.js](https://nodejs.org/en/) 서버-사이드 어플리케이션을 만들기 위한 프레임워크입니다. 진보적인 자바스크립트를 사용하고, [타입스크립트(TypeScript)](http://www.typescriptlang.org/) 를 완전히 지원하고, OOP(객체 지향 프로그래밍, Object Oriented Programming), FP(함수형 프로그래밍, Functional Programming), 그리고 FRP(함수형 반응형 프로그래밍, Functional Reactive Programming)의 개념들을 묶어서 만들어졌습니다.


내부적으로 Nest는 [Express](https://expressjs.com/)(기본, the default)와 [Fastify](https://github.com/fastify/fastify)와 같이 강한 HTTP 서버 프레임워크의 사용으로 만들어졌습니다. Nest는 이들 프레임워크 보다 위에 추상의 레벨을 제공합니다. 그러나 그 API들을 개발자에 직접적으로 드러내기도 합니다. 따라서 각 플랫폼에서 사용할 수있는 무수히 많은 타사 모듈(Third-party modules)을 쉽게 사용할 수 있습니다

### 사상

최근 몇년동안, Node.js 덕분에 자바스크립트는 프론트엔드 및 백엔드 애플리케이션의 위한 웹의 “공통어(共通語)-링구아 프랑카(lingua franca)”가 되었습니다. 이는 개발자의 생산성을 개선하고, 프론트엔드 어플리케이션을 빠른 개발하고, 테스트하고, 확장가능하게 만들어준 [Angular](https://angular.io/), [React](https://github.com/facebook/react) 그리고 [Vue](https://github.com/vuejs/vue)와 같은 멋진 프로젝트들의 부상 덕분입니다. 하지만, 다수의 훌륭한 라이브러리들, 조력자들 그리고 도구들이 Node (그리고 서버사이드 자바스크립트)를 위해 존재하는 동안, 아키텍처라는 주요 문제를 효과적으로 해결하는 것은 없었습니다.

네스트는 개발자와 팀이 테스트가능한, 확장가능한, 느슨하게 결합된, 그리고 쉽게 유지보수할 수 있는 애플리케이션을 만들 수 있는 바로사용가능한 애플리케이션 아키텍처를 제공합니다.

#### 설치

To get started, you can either scaffold the project with the [Nest CLI](/cli/overview), or clone a starter project (both will produce the same outcome).

시작하기, [Nest CLI](/cli/overview) 또는 스타터 프로젝트를 복사해서 프로젝트 뼈대를 만들 수 있습니다.(둘다 같은 결과를 만들 것입니다.)

Creating a new project with the **Nest CLI** is recommended for first-time users. We'll continue with this approach in [First Steps](first-steps).
Nest CLI로 프로젝트 뼈대를 만든다면, 다음 명령어를 실행하세요. 새로운 프로젝트 디렉토리를 만들고, 초기의 핵심 Nest 파일들과 지원 모듈들, 관례적인 기본 구조의 프로젝트 구조로 채웁니다. 처음으로 사용하는 유저는 **Nest CLI**를 사용해서 새 프로젝트를 만들 것을 추천합니다. [첫 번째 단계](first-steps)에서 이 접근 방법을 계속 사용하겠습니다.  

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```


위 방법 대신, 타입스크립트 git으로 타입스크립트 스타터 프로젝트를 인스톨합니다.

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

스타터 프로젝트의 자바스크립트 맛을 살리려면, 위의 명령 순서에서 `javascript-starter.git`를 사용하세요.
 
또한, **npm** (또는 **yarn**)으로 핵심과 지원파일들을 처음부터 수동으로 새 프로젝트를 만들 수 있습니다. 이 경우, 당연히, 프로젝트 표준형식 파일들을 직접 만들어야할 책임이 당신에게 있습니다.

```bash
$ npm i --save @nestjs/core @nestjs/common rxjs reflect-metadata
```

#### Stay in touch

- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)
