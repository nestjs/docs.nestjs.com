
### 소개

Nest (NestJS)는 효율적이고 확장 가능한 [Node.js](https://nodejs.org/) 서버 사이드 애플리케이션을 구축하기 위한 프레임워크입니다. 최신 JavaScript를 사용하며, [TypeScript](http://www.typescriptlang.org/)로 작성되고 이를 완벽히 지원하지만, 순수 JavaScript로 코딩하는 것도 가능합니다. 또한 OOP(객체 지향 프로그래밍), FP(함수형 프로그래밍), FRP(함수형 반응형 프로그래밍)의 요소를 결합하고 있습니다.

Nest는 기본적으로 [Express](https://expressjs.com/)와 같은 강력한 HTTP 서버 프레임워크를 사용하며, 선택적으로 [Fastify](https://github.com/fastify/fastify)를 구성하여 사용할 수도 있습니다.

Nest는 이러한 일반적인 Node.js 프레임워크(Express/Fastify) 위에 추상화를 제공하면서도, 개발자에게 이들의 API를 직접 노출합니다. 이를 통해 기본 플랫폼에서 사용할 수 있는 수많은 서드파티 모듈들을 자유롭게 활용할 수 있습니다.

#### 철학

최근 몇 년 동안 Node.js 덕분에 JavaScript는 프론트엔드와 백엔드 애플리케이션 모두에서 "웹의 공통 언어"로 자리 잡았습니다. 이는 [Angular](https://angular.dev/), [React](https://github.com/facebook/react), [Vue](https://github.com/vuejs/vue)와 같은 놀라운 프로젝트들의 탄생을 이끌었습니다. 이러한 프로젝트들은 개발자의 생산성을 향상시키고, 빠르고 테스트 가능하며 확장 가능한 프론트엔드 애플리케이션을 만드는데 기여합니다. 하지만 Node와 서버 사이드 JavaScript에는 훌륭한 라이브러리와 도구들이 많음에도 불구하고, **아키텍처**라는 주요 문제를 효과적으로 해결하는 솔루션이 없었습니다.

Nest는 아키텍처를 즉시 제공하여, 개발자와 팀이 테스트 가능하고, 확장 가능하며, 느슨하게 결합되고, 쉽게 유지 관리할 수 있는 애플리케이션을 만들 수 있게 해줍니다. 이 아키텍처는 Angular에서 많은 영감을 받았습니다.

#### 설치

시작하려면 [Nest CLI](/cli/overview)를 사용하여 프로젝트를 스캐폴딩하거나 [스타터 프로젝트를 복제](#alternatives)할 수 있습니다(둘 다 동일한 결과를 생성합니다).

Nest CLI로 프로젝트를 스캐폴딩하려면 다음 명령어를 실행하세요. 이 명령어는 새로운 프로젝트 디렉토리를 생성하고, 해당 디렉토리에 초기 핵심 Nest 파일 및 지원 모듈을 채워 프로젝트의 기본 구조를 만듭니다. **Nest CLI**를 사용해 새 프로젝트를 생성하는 것은 처음 사용자에게 권장됩니다. [First Steps](first-steps)에서 이 방법으로 계속 진행하겠습니다.

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

> info **힌트** TypeScript 프로젝트를 더 엄격한 기능 집합으로 생성하려면 `nest new` 명령에 `--strict` 플래그를 추가하세요.

#### 대안

대안으로 **Git**을 사용하여 TypeScript 스타터 프로젝트를 설치하려면:

```bash
$ git clone https://github.com/nestjs/typescript-starter.git project
$ cd project
$ npm install
$ npm run start
```

> info **힌트** Git 기록 없이 저장소를 복제하려면 [degit](https://github.com/Rich-Harris/degit)을 사용할 수 있습니다.

브라우저를 열고 [`http://localhost:3000/`](http://localhost:3000/)으로 이동하세요.

스타터 프로젝트의 JavaScript 버전을 설치하려면 위 명령에서 `javascript-starter.git`을 사용하세요.

핵심 패키지와 지원 패키지를 설치하여 새 프로젝트를 처음부터 시작할 수도 있습니다. 이 경우 프로젝트 보일러플레이트 파일을 직접 설정해야 합니다. 최소한 `@nestjs/core`, `@nestjs/common`, `rxjs`, `reflect-metadata` 패키지가 필요합니다. 간단한 프로젝트를 만드는 방법에 대한 짧은 글을 확인하세요: [5 steps to create a bare minimum NestJS app from scratch!](https://dev.to/micalevisk/5-steps-to-create-a-bare-minimum-nestjs-app-from-scratch-5c3b).
