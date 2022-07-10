### CRUD generator

(Gerador CRUD)

Ao longo da vida útil de um projeto, quando criamos novos recursos, geralmente precisamos adicionar novos recursos ao nosso aplicativo. Esses recursos normalmente exigem várias operações repetitivas que temos que repetir cada vez que definimos um novo recurso.

#### Introduction

(Introdução)

Vamos imaginar um cenário do mundo real, onde precisamos expor endpoints CRUD para 2 entidades, digamos, **Usuário** e **Produto**.
Seguindo as melhores práticas, para cada entidade teríamos que realizar várias operações, como segue:

- Gere um módulo (`nest g mo`) para manter o código organizado e estabelecer limites claros (agrupando componentes relacionados)
- Gere um controlador (`nest g co`) para definir rotas CRUD (ou consultas/mutações para aplicativos GraphQL)
- Gere um serviço (`nest g s`) para implementar e isolar a lógica de negócios
- Gere uma classe/interface de entidade para representar a forma de dados do recurso
- Gerar Objetos de Transferência de Dados (ou entradas para aplicativos GraphQL) para definir como os dados serão enviados pela rede

São muitos passos!

Para ajudar a acelerar esse processo repetitivo, o [Nest CLI](/cli/overview) fornece um gerador (esquemático) que gera automaticamente todo o código padrão para nos ajudar a evitar tudo isso e tornar a experiência do desenvolvedor muito mais simples.

> info **Observação** O esquema suporta a geração de controladores **HTTP**, controladores **Microservice**, resolvedores **GraphQL** (primeiro código e esquema primeiro) e Gateways **WebSocket**.

#### Generating a new resource

(Gerando um novo recurso)

Para criar um novo recurso, basta executar o seguinte comando no diretório raiz do seu projeto:

```shell
$ nest g resource
```

O comando `nest g resource` não apenas gera todos os blocos de construção do NestJS (módulo, serviço, classes de controlador), mas também uma classe de entidade, classes DTO, bem como os arquivos de teste (`.spec`).

Abaixo você pode ver o arquivo do controlador gerado (para API REST):

```typescript
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  create(@Body() createUserDto: CreateUserDto) {
    return this.usersService.create(createUserDto);
  }

  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.usersService.update(+id, updateUserDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.usersService.remove(+id);
  }
}
```

Além disso, ele cria automaticamente espaços reservados para todos os endpoints CRUD (rotas para APIs REST, consultas e mutações para GraphQL, assinaturas de mensagens para Microservices e Gateways WebSocket) - tudo sem ter que levantar um dedo.

> aviso **Observação** As classes de serviço geradas **não** estão vinculadas a nenhum **ORM (ou fonte de dados)** específico. Isso torna o gerador genérico o suficiente para atender às necessidades de qualquer projeto. Por padrão, todos os métodos conterão espaços reservados, permitindo que você os preencha com as fontes de dados específicas do seu projeto.

Da mesma forma, se você quiser gerar resolvedores para um aplicativo GraphQL, basta selecionar o `GraphQL (code first)` (ou `GraphQL (schema first)`) como sua camada de transporte.

Nesse caso, o NestJS gerará uma classe de resolução em vez de um controlador de API REST:

```shell
$ nest g resource users

> ? What transport layer do you use? GraphQL (code first)
> ? Would you like to generate CRUD entry points? Yes
> CREATE src/users/users.module.ts (224 bytes)
> CREATE src/users/users.resolver.spec.ts (525 bytes)
> CREATE src/users/users.resolver.ts (1109 bytes)
> CREATE src/users/users.service.spec.ts (453 bytes)
> CREATE src/users/users.service.ts (625 bytes)
> CREATE src/users/dto/create-user.input.ts (195 bytes)
> CREATE src/users/dto/update-user.input.ts (281 bytes)
> CREATE src/users/entities/user.entity.ts (187 bytes)
> UPDATE src/app.module.ts (312 bytes)
```

> info **Dica** Para evitar a geração de arquivos de teste, você pode passar o sinalizador `--no-spec`, como segue: `nest g resource users --no-spec`

Podemos ver abaixo que não apenas todas as mutações e consultas padrão foram criadas, mas tudo está amarrado. Estamos utilizando a entidade `UsersService`, `User` e nossos DTO's.

```typescript
import { Resolver, Query, Mutation, Args, Int } from '@nestjs/graphql';
import { UsersService } from './users.service';
import { User } from './entities/user.entity';
import { CreateUserInput } from './dto/create-user.input';
import { UpdateUserInput } from './dto/update-user.input';

@Resolver(() => User)
export class UsersResolver {
  constructor(private readonly usersService: UsersService) {}

  @Mutation(() => User)
  createUser(@Args('createUserInput') createUserInput: CreateUserInput) {
    return this.usersService.create(createUserInput);
  }

  @Query(() => [User], { name: 'users' })
  findAll() {
    return this.usersService.findAll();
  }

  @Query(() => User, { name: 'user' })
  findOne(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.findOne(id);
  }

  @Mutation(() => User)
  updateUser(@Args('updateUserInput') updateUserInput: UpdateUserInput) {
    return this.usersService.update(updateUserInput.id, updateUserInput);
  }

  @Mutation(() => User)
  removeUser(@Args('id', { type: () => Int }) id: number) {
    return this.usersService.remove(id);
  }
}
```
