### 첫 단계

이 글 모음(Overviews)에서는, Nest의 핵심 기초들을 배울 것입니다. Nest 애플리케이션의 필수적인 구성요소들과 친숙해지도록, 입문 레벨에서 많이 다루는 기능들로 기본적인 CRUD 애플리케이션을 만들 것입니다. 

#### 언어

우리는 [TypeScript](http://www.typescriptlang.org/)를 사랑합니다. 하지만 무엇보다도 - 우리는 [Node.js](https://nodejs.org/en/)를 사랑합니다. 그게 Nest가 TypeScript 와 **순수한 자바스크립트** 둘다 호환되는 이유입니다. Nest는 최신 언어 기능을 활용합니다. 그래서 바닐라 자바스크립트와 함께 사용하려면 [Babel](http://babeljs.io/) 컴파일러가 필요합니다.

우리는 우리가 제공하는 예제에서 주로 TypeScript를 사용할 것입니다. 하지만 항상 바날라 자바스크립트 문법으로 **코드 예문들을 변경**할 수 있습니다. (간단하게 각 예문의 오른쪽 위 구석에 있는 언어 버튼을 클릭하여 변경합니다.)

#### 선행 조건

[Node.js](https://nodejs.org/) (>= 8.9.0)가 운영체제에 설치되어 있는지 확인해주세요.

#### 설치

[Nest CLI](/cli/overview)로 새로운 프로젝트를 만드는 것은 아주 간단합니다. [npm](https://www.npmjs.com/)이 설치되어 있으면, 아래 명령어로 새로운 Nest 프로젝트를 터미널에서 만들 수 있습니다.

```bash
$ npm i -g @nestjs/cli
$ nest new project-name
```

프로젝트 디렉토리가 만들어지고, node 모듈과 몇 개의 다른 보일러플레이트(Boilerplate) 파일이 설치 될 것입니다, 그리고 `src/` 디렉토리가 만든 후, 몇몇 핵심 파일로 채워집니다.

<div class="file-tree">
  <div class="item">src</div>
  <div class="children">
    <div class="item">app.controller.ts</div>
    <div class="item">app.module.ts</div>
    <div class="item">main.ts</div>
  </div>
</div>

핵심 파일에 대한 간략한 개요는 다음과 같습니다:

|                     |                                                                                                                     |
| ------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `app.controller.ts` | 하나의 경로만 가지는 기본 컨트롤러 예제                                                                             |
| `app.module.ts`     | 애플리케이션의 루트(root)모듈                                                                                       |
| `main.ts`           | 핵심 함수 NestFactory를 사용하여 Nest 어플리케이션 인스턴스를 생성하는 애플리케이션의 기본시작 파일                 |


`main.ts`에는 비동기(async) 함수가 포함되어있어 우리의 애플리케이션을 불러와서 시작합니다. 

```typescript
@@filename(main)

import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
@@switch
import { NestFactory } from '@nestjs/core';
import { ApplicationModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(ApplicationModule);
  await app.listen(3000);
}
bootstrap();
```

Nest 애플리케이션 인스턴스를 만들 때, 우리는 바로 핵심 `NestFactory` 클래스를 사용합니다. `NestFactory`는 애플리케이션 인스턴스를 만들 수 있는 몇가지 정적(static) 메소드를 제공합니다. `create ()`메소드는`INestApplication` 인터페이스를 구현하는 응용 프로그램 객체를 반환합니다. 이 객체는 다음 장에서 설명 할 일련의 메소드 묶음을 제공합니다. 위의`main.ts` 예제에서 HTTP 리스너를 시작하기 만하면 애플리케이션이 인바운드 HTTP 요청을 기다릴 수 있습니다.

Nest CLI로 스캐폴딩 된 프로젝트는 개발자가 각 모듈을 전용 디렉토리에 보관하는 규칙을 따르도록하는 초기 프로젝트 구조를 만듭니다.

#### 플랫폼

Nest는 플랫폼에 독립적 인 프레임 워크를 목표로합니다. 플랫폼 독립성을 통해 재사용 가능한 논리 파트를 작성한다는 것은 개발자가 여러 다른 유형의 애플리케이션 사이에서 이점을 누릴 수 있게합니다. 기술적으로, Nest는 어댑터가 생성되면 어떤 노드 HTTP 프레임워크와도 함께 작동 할 수 있습니다. 

기본 제공되는 두 가지 HTTP 플랫폼이 있습니다.: [express](https://expressjs.com/) and [fastify](https://www.fastify.io). 당신의 요구에 맞는 가장 적합한 것을 선택할 수 있습니다.

|                    |                                                                                                                                                                                                                                                                                                                                      |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `platform-express` | [Express](https://expressjs.com/)는 노드에서 잘 알려진 경량화된 웹 프레임워크입니다. 커뮤니티에서 구현 한 많은 리소스를 갖추어 잘 검증 되고 제품에 사용할 수 있는 라이브러리입니다. `@nestjs/platform-express` 패키지는 기본 적으로 사용됩니다. 많은 사용자가 Express를 잘 사용하였고, 사용하기 위해 아무런 조치도 취하지 않아도 됩니다. |
| `platform-fastify` | [Fastify](https://www.fastify.io/)는 효율성과 속도를 최대화하는 데 중점을 둔 고성능 및 저비용 프레임 워크입니다. 어떻게 사용하는지 [여기](/techniques/performance)를 읽어보세요.                                                                                                                                                     |

어떤 플랫폼이 사용 되든간에 자체 응용 프로그램 인터페이스를 제공합니다. 이것들은 각각`NestExpressApplication`과`NestFastifyApplication`으로 보여집니다.

아래 예제 처럼 `NestFactory.create()` 메소드에 타입을 전달 할 때, `app` 객체는 그 특정 플랫폼을 위해서만 사용할 수있는 메소드를 가질 것입니다. 주의, 하지만, 실제로 제공되는 플랫폼 API에 액세스**하려 하지 않는 한** 타입을 지정할 **필요**가 없습니다.

```typescript
const app = await NestFactory.create<NestExpressApplication>(ApplicationModule);
```

#### 애플리케이션 실행하기

설치 프로세스가 완료되면, OS 명령 프롬프트에서 다음 명령을 실행하여 인바운드 HTTP 요청을 수신하는 응용 프로그램을 시작할 수 있습니다.

```bash
$ npm run start
```

이 명령은 `src/main.ts` 파일에 정의 된 포트로 리스닝하는 HTTP 서버로 앱을 시작합니다. 애플리케이션이 실행되면, 브라우저를 열어서 `http://localhost:3000/` 주소로 접속합니다. 그러면 `Hello world!` 메세지를 볼 것입니다.
