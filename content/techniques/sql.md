### Database

(Base de dados)

Nest é independente de banco de dados, permitindo que você integre facilmente com qualquer banco de dados SQL ou NoSQL. Você tem várias opções disponíveis, dependendo de suas preferências. No nível mais geral, conectar o Nest a um banco de dados é simplesmente uma questão de carregar um driver Node.js apropriado para o banco de dados, assim como você faria com o [Express](https://expressjs.com/en/guide/database-integration.html) ou Fastify.

Você também pode usar diretamente qualquer **biblioteca** ou ORM de integração de banco de dados Node.js de propósito geral, como [MikroORM](https://mikro-orm.io/) também verifique a [receita aqui](/recipes/mikroorm ), [Sequelize](https://sequelize.org/) (navegue até a seção [Sequelize integration](/techniques/database#sequelize-integration)), [Knex.js](https://knexjs.org/ ) ([tutorial](https://dev.to/nestjs/build-a-nestjs-module-for-knex-js-or-other-resource-based-libraries-in-5-minutes-12an)), [TypeORM](https://github.com/typeorm/typeorm) e [Prisma](https://www.github.com/prisma/prisma) ([receita](/recipes/prisma)) , para operar em um nível mais alto de abstração.

Por conveniência, o Nest oferece integração total com TypeORM e Sequelize prontos para uso com os pacotes `@nestjs/typeorm` e `@nestjs/sequelize` respectivamente, que abordaremos no capítulo atual, e Mongoose com ` @nestjs/mongoose`, que é abordado [neste capítulo](/techniques/mongodb). Essas integrações fornecem recursos adicionais específicos do NestJS, como injeção de modelo/repositório, testabilidade e configuração assíncrona para facilitar ainda mais o acesso ao banco de dados escolhido.

### TypeORM Integration

(Integração do TypeORM)

Para integração com bancos de dados SQL e NoSQL, o Nest fornece o pacote `@nestjs/typeorm`. O Nest usa [TypeORM](https://github.com/typeorm/typeorm) porque é o Mapeador Relacional de Objetos (ORM) mais maduro disponível para TypeScript. Por ser escrito em TypeScript, ele se integra bem ao framework Nest.

Para começar a usá-lo, primeiro instalamos as dependências necessárias. Neste capítulo, demonstraremos usando o popular [MySQL](https://www.mysql.com/) DBMS Relacional, mas o TypeORM fornece suporte para muitos bancos de dados relacionais, como PostgreSQL, Oracle, Microsoft SQL Server, SQLite, e até mesmo bancos de dados NoSQL como MongoDB. O procedimento que percorremos neste capítulo será o mesmo para qualquer banco de dados suportado pelo TypeORM. Você simplesmente precisará instalar as bibliotecas de API do cliente associadas para o banco de dados selecionado.

```bash
$ npm install --save @nestjs/typeorm typeorm mysql2
```

Quando o processo de instalação estiver concluído, podemos importar o `TypeOrmModule` para a raiz `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
 imports: [
   TypeOrmModule.forRoot({
     type: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     entities: [],
     synchronize: true,
   }),
 ],
})
export class AppModule {}
```

> warning **Aviso** A configuração `synchronize: true` não deve ser usada em produção - caso contrário, você pode perder dados de produção.

O método `forRoot()` suporta todas as propriedades de configuração expostas pelo construtor `DataSource` do pacote [TypeORM](https://typeorm.io/data-source-options#common-data-source-options). Além disso, existem várias propriedades de configuração extra descritas abaixo.

<table>
  <tr>
    <td><code>retryAttempts</code></td>
    <td>Número de tentativas de conexão com o banco de dados (padrão: <code>10</code>)</td>
  </tr>
  <tr>
    <td><code>retryDelay</code></td>
    <td>Atraso entre tentativas de conexão (ms) (padrão: <code>3000</code>)</td>
  </tr>
  <tr>
    <td><code>autoLoadEntities</code></td>
    <td>Se <code>true</code>, as entidades serão carregadas automaticamente (padrão: <code>false</code>)</td>
  </tr>
</table>

> info **Dica** Saiba mais sobre as opções de fonte de dados [aqui](https://typeorm.io/data-source-options).

Feito isso, os objetos TypeORM `DataSource` e `EntityManager` estarão disponíveis para injetar em todo o projeto (sem a necessidade de importar nenhum módulo), por exemplo:

```typescript
@@filename(app.module)
import { DataSource } from 'typeorm';

@Module({
 imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
 constructor(private dataSource: DataSource) {}
}
@@switch
import { DataSource } from 'typeorm';

@Dependencies(DataSource)
@Module({
 imports: [TypeOrmModule.forRoot(), UsersModule],
})
export class AppModule {
 constructor(dataSource) {
   this.dataSource = dataSource;
 }
}
```

#### Repository pattern

(Padrão de repositório)

[TypeORM](https://github.com/typeorm/typeorm) é compatível com o **padrão de design de repositório**, portanto, cada entidade tem seu próprio repositório. Esses repositórios podem ser obtidos na fonte de dados do banco de dados.

Para continuar o exemplo, precisamos de pelo menos uma entidade. Vamos definir a entidade `User`.


```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class User {
 @PrimaryGeneratedColumn()
 id: number;

 @Column()
 firstName: string;

 @Column()
 lastName: string;

 @Column({ default: true })
 isActive: boolean;
}
```

> info **Dica** Saiba mais sobre entidades na [documentação do TypeORM](https://typeorm.io/#/entities).

O arquivo de entidade `User` fica no diretório `users`. Este diretório contém todos os arquivos relacionados ao `UsersModule`. Você pode decidir onde manter seus arquivos de modelo, no entanto, recomendamos criá-los perto de seu **domínio**, no diretório do módulo correspondente.

Para começar a usar a entidade `User`, precisamos informar o TypeORM sobre ela inserindo-a no array `entities` nas opções do método `forRoot()` do módulo (a menos que você use um caminho glob estático):


```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './users/user.entity';

@Module({
 imports: [
   TypeOrmModule.forRoot({
     type: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     entities: [User],
     synchronize: true,
   }),
 ],
})
export class AppModule {}
```

Em seguida, vamos ver o `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { User } from './user.entity';

@Module({
 imports: [TypeOrmModule.forFeature([User])],
 providers: [UsersService],
 controllers: [UsersController],
})
export class UsersModule {}
```

Este módulo usa o método `forFeature()` para definir quais repositórios são registrados no escopo atual. Com isso, podemos injetar o `UsersRepository` no `UsersService` usando o decorador `@InjectRepository()`:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
 constructor(
   @InjectRepository(User)
   private usersRepository: Repository<User>,
 ) {}

 findAll(): Promise<User[]> {
   return this.usersRepository.find();
 }

 findOne(id: string): Promise<User> {
   return this.usersRepository.findOneBy({ id });
 }

 async remove(id: string): Promise<void> {
   await this.usersRepository.delete(id);
 }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { User } from './user.entity';

@Injectable()
@Dependencies(getRepositoryToken(User))
export class UsersService {
 constructor(usersRepository) {
   this.usersRepository = usersRepository;
 }

 findAll() {
   return this.usersRepository.find();
 }

 findOne(id) {
   return this.usersRepository.findOneBy({ id });
 }

 async remove(id) {
   await this.usersRepository.delete(id);
 }
}
```

> warning **Aviso** Não se esqueça de importar o `UsersModule` para o `AppModule` raiz.

Se você quiser usar o repositório fora do módulo que importa `TypeOrmModule.forFeature`, você precisará exportar os provedores gerados por ele.
Você pode fazer isso exportando o módulo inteiro, assim:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';

@Module({
 imports: [TypeOrmModule.forFeature([User])],
 exports: [TypeOrmModule]
})
export class UsersModule {}
```

Agora, se importarmos `UsersModule` em `UserHttpModule`, podemos usar `@InjectRepository(User)` nos provedores do último módulo.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
 imports: [UsersModule],
 providers: [UsersService],
 controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

(Relações)

Relações são associações estabelecidas entre duas ou mais tabelas. As relações são baseadas em campos comuns de cada tabela, geralmente envolvendo chaves primárias e estrangeiras.

Existem três tipos de relações:

<table>
 <tr>
   <td><code>Um para um</code></td>
   <td>Cada linha na tabela primária tem uma e apenas uma linha associada na tabela estrangeira. Use o decorador <code>@OneToOne()</code> para definir esse tipo de relação.</td>
 </tr>
 <tr>
   <td><code>Um para muitos / Muitos para um</code></td>
   <td>Cada linha na tabela primária tem uma ou mais linhas relacionadas na tabela estrangeira. Use os decoradores <code>@OneToMany()</code> e <code>@ManyToOne()</code> para definir esse tipo de relação.</td>
 </tr>
 <tr>
   <td><code>Muitos para muitos</code></td>
   <td>Cada linha na tabela primária tem muitas linhas relacionadas na tabela estrangeira, e cada registro na tabela estrangeira tem muitas linhas relacionadas na tabela primária. Use o decorador <code>@ManyToMany()</code> para definir esse tipo de relação.</td>
 </tr>
</table>

Para definir relações em entidades, use os **decoradores** correspondentes. Por exemplo, para definir que cada `User` pode ter várias fotos, use o decorador `@OneToMany()`.

```typescript
@@filename(user.entity)
import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { Photo } from '../photos/photo.entity';

@Entity()
export class User {
 @PrimaryGeneratedColumn()
 id: number;

 @Column()
 firstName: string;

 @Column()
 lastName: string;

 @Column({ default: true })
 isActive: boolean;

 @OneToMany(type => Photo, photo => photo.user)
 photos: Photo[];
}
```

> info **Dica** Para saber mais sobre relações no TypeORM, visite a [documentação do TypeORM](https://typeorm.io/#/relations).

#### Auto-load entities

(Entidades de carregamento automático)

Adicionar entidades manualmente ao array `entities` das opções de fonte de dados pode ser tedioso. Além disso, fazer referência a entidades do módulo raiz quebra os limites do domínio do aplicativo e causa o vazamento de detalhes de implementação para outras partes do aplicativo. Para resolver esse problema, uma solução alternativa é fornecida. Para carregar entidades automaticamente, defina a propriedade `autoLoadEntities` do objeto de configuração (passado para o método `forRoot()`) como `true`, conforme mostrado abaixo:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

@Module({
 imports: [
   TypeOrmModule.forRoot({
     ...
     autoLoadEntities: true,
   }),
 ],
})
export class AppModule {}
```

Com essa opção especificada, cada entidade registrada através do método `forFeature()` será automaticamente adicionada ao array `entities` do objeto de configuração.

> warning **Aviso** Observe que as entidades que não são registradas através do método `forFeature()`, mas são apenas referenciadas a partir da entidade (por meio de um relacionamento), não serão incluídas por meio da configuração `autoLoadEntities` .

#### Separating entity definition

(Separando a definição da entidade)

Você pode definir uma entidade e suas colunas diretamente no modelo, usando decoradores. Mas algumas pessoas preferem definir entidades e suas colunas dentro de arquivos separados usando os ["esquemas de entidade"](https://typeorm.io/#/separating-entity-definition).

```typescript
import { EntitySchema } from 'typeorm';
import { User } from './user.entity';

export const UserSchema = new EntitySchema<User>({
 name: 'User',
 target: User,
 columns: {
   id: {
     type: Number,
     primary: true,
     generated: true,
   },
   firstName: {
     type: String,
   },
   lastName: {
     type: String,
   },
   isActive: {
     type: Boolean,
     default: true,
   },
 },
 relations: {
   photos: {
     type: 'one-to-many',
     target: 'Photo', // the name of the PhotoSchema
   },
 },
});
```

> warning error **Aviso** Se você fornecer a opção `target`, o valor da opção `name` deve ser o mesmo que o nome da classe de destino.
> Se você não fornecer o `target`, você pode usar qualquer nome.

Nest permite que você use uma instância `EntitySchema` sempre que uma `Entity` for esperada, por exemplo:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserSchema } from './user.schema';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
 imports: [TypeOrmModule.forFeature([UserSchema])],
 providers: [UsersService],
 controllers: [UsersController],
})
export class UsersModule {}
```

#### Transactions

(Transações)

Uma transação de banco de dados simboliza uma unidade de trabalho realizada dentro de um sistema de gerenciamento de banco de dados em relação a um banco de dados e tratada de maneira coerente e confiável, independente de outras transações. Uma transação geralmente representa qualquer alteração em um banco de dados ([saiba mais](https://en.wikipedia.org/wiki/Database_transaction)).

Existem muitas estratégias diferentes para lidar com [transações TypeORM](https://typeorm.io/#/transactions). Recomendamos usar a classe `QueryRunner` porque dá controle total sobre a transação.

Primeiro, precisamos injetar o objeto `DataSource` em uma classe da maneira normal:

```typescript
@Injectable()
export class UsersService {
 constructor(private dataSource: DataSource) {}
}
```

> info **Dica** A classe `DataSource` é importada do pacote `typeorm`.

Agora, podemos usar este objeto para criar uma transação.

```typescript
async createMany(users: User[]) {
 const queryRunner = this.dataSource.createQueryRunner();

 await queryRunner.connect();
 await queryRunner.startTransaction();
 try {
   await queryRunner.manager.save(users[0]);
   await queryRunner.manager.save(users[1]);

   await queryRunner.commitTransaction();
 } catch (err) {
   // since we have errors lets rollback the changes we made
   await queryRunner.rollbackTransaction();
 } finally {
   // you need to release a queryRunner which was manually instantiated
   await queryRunner.release();
 }
}
```

> info **Dica** Observe que o `dataSource` é usado apenas para criar o `QueryRunner`. No entanto, para testar essa classe seria necessário zombar de todo o objeto `DataSource` (que expõe vários métodos). Assim, recomendamos usar uma classe de fábrica auxiliar (por exemplo, `QueryRunnerFactory`) e definir uma interface com um conjunto limitado de métodos necessários para manter as transações. Essa técnica torna a zombaria desses métodos bastante simples.

Como alternativa, você pode usar a abordagem de estilo de retorno de chamada com o método `transaction` do objeto `DataSource` ([leia mais](https://typeorm.io/#/transactions/creating-and-using-transactions)).

```typescript
async createMany(users: User[]) {
 await this.dataSource.transaction(async manager => {
   await manager.save(users[0]);
   await manager.save(users[1]);
 });
}
```

Usar decoradores para controlar a transação (`@Transaction()` e `@TransactionManager()`) não é recomendado.

<app-banner-shop></app-banner-shop>

#### Subscribers

(Assinantes)

Com o TypeORM [subscribers](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber), você pode ouvir eventos de entidade específicos.

```typescript
import {
 DataSource,
 EntitySubscriberInterface,
 EventSubscriber,
 InsertEvent,
} from 'typeorm';
import { User } from './user.entity';

@EventSubscriber()
export class UserSubscriber implements EntitySubscriberInterface<User> {
 constructor(dataSource: DataSource) {
   dataSource.subscribers.push(this);
 }

 listenTo() {
   return User;
 }

 beforeInsert(event: InsertEvent<User>) {
   console.log(`BEFORE USER INSERTED: `, event.entity);
 }
}
```

> error **Aviso** Os assinantes do evento não podem ser [request-scoped](/fundamentals/injection-scopes).

Agora, adicione a classe `UserSubscriber` ao array `providers`:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UserSubscriber } from './user.subscriber';

@Module({
 imports: [TypeOrmModule.forFeature([User])],
 providers: [UsersService, UserSubscriber],
 controllers: [UsersController],
})
export class UsersModule {}
```

> info **Dica** Saiba mais sobre os assinantes da entidade [aqui](https://typeorm.io/#/listeners-and-subscribers/what-is-a-subscriber).

#### Migrations

(Migrações)

[Migrations](https://typeorm.io/#/migrations) fornecem uma maneira de atualizar incrementalmente o esquema do banco de dados para mantê-lo sincronizado com o modelo de dados do aplicativo enquanto preserva os dados existentes no banco de dados. Para gerar, executar e reverter migrações, o TypeORM fornece uma [CLI](https://typeorm.io/#/migrations/creating-a-new-migration) dedicada.

As classes de migração são separadas do código-fonte do aplicativo Nest. Seu ciclo de vida é mantido pela CLI do TypeORM. Portanto, você não pode aproveitar a injeção de dependência e outros recursos específicos do Nest com migrações. Para saber mais sobre migrações, siga o guia na [documentação do TypeORM](https://typeorm.io/#/migrations/creating-a-new-migration).

#### Multiple databases

(Múltiplos bancos de dados)

Alguns projetos exigem várias conexões de banco de dados. Isso também pode ser alcançado com este módulo. Para trabalhar com várias conexões, primeiro crie as conexões. Nesse caso, a nomenclatura da fonte de dados se torna **obrigatória**.

Suponha que você tenha uma entidade `Album` armazenada em seu próprio banco de dados.

```typescript
const defaultOptions = {
 type: 'postgres',
 port: 5432,
 username: 'user',
 password: 'password',
 database: 'db',
 synchronize: true,
};

@Module({
 imports: [
   TypeOrmModule.forRoot({
     ...defaultOptions,
     host: 'user_db_host',
     entities: [User],
   }),
   TypeOrmModule.forRoot({
     ...defaultOptions,
     name: 'albumsConnection',
     host: 'album_db_host',
     entities: [Album],
   }),
 ],
})
export class AppModule {}
```

> warning **Aviso** Se você não definir o `name` para uma fonte de dados, seu nome será definido como `default`. Observe que você não deve ter várias conexões sem nome ou com o mesmo nome, caso contrário elas serão substituídas.

> warning **Aviso** Se você estiver usando `TypeOrmModule.forRootAsync`, será necessário definir o nome da fonte de dados fora de `useFactory`. Por exemplo:
>
> ```typescript
> TypeOrmModule.forRootAsync({
>   name: 'albumsConnection',
>   useFactory: ...,
>   inject: ...,
> }),
> ```
>
> Veja [esta edição](https://github.com/nestjs/typeorm/issues/86) para mais detalhes.

Neste ponto, você tem entidades `User` e `Album` registradas com sua própria fonte de dados. Com esta configuração, você tem que dizer ao método `TypeOrmModule.forFeature()` e ao decorador `@InjectRepository()` qual fonte de dados deve ser usada. Se você não passar nenhum nome de fonte de dados, a fonte de dados `default` será usada.

```typescript
@Module({
 imports: [
   TypeOrmModule.forFeature([User]),
   TypeOrmModule.forFeature([Album], 'albumsConnection'),
 ],
})
export class AppModule {}
```

Você também pode injetar o `DataSource` ou `EntityManager` para uma determinada fonte de dados:

```typescript
@Injectable()
export class AlbumsService {
 constructor(
   @InjectConnection('albumsConnection')
   private dataSource: DataSource,
   @InjectEntityManager('albumsConnection')
   private entityManager: EntityManager,
 ) {}
}
```

Também é possível injetar qualquer `DataSource` para os provedores:

```typescript
@Module({
 providers: [
   {
     provide: AlbumsService,
     useFactory: (albumsConnection: DataSource) => {
       return new AlbumsService(albumsConnection);
     },
     inject: [getDataSourceToken('albumsConnection')],
   },
 ],
})
export class AlbumsModule {}
```

#### Testing

(Teste)

Quando se trata de teste de unidade de um aplicativo, geralmente queremos evitar fazer uma conexão com o banco de dados, mantendo nossos conjuntos de testes independentes e seu processo de execução o mais rápido possível. Mas nossas classes podem depender de repositórios que são extraídos da instância da fonte de dados (conexão). Como lidamos com isso? A solução é criar repositórios simulados. Para conseguir isso, configuramos [provedores personalizados](/fundamentals/custom-providers). Cada repositório registrado é automaticamente representado por um token `<EntityName>Repository`, onde `EntityName` é o nome da sua classe de entidade.

O pacote `@nestjs/typeorm` expõe a função `getRepositoryToken()` que retorna um token preparado com base em uma determinada entidade.

```typescript
@Module({
 providers: [
   UsersService,
   {
     provide: getRepositoryToken(User),
     useValue: mockRepository,
   },
 ],
})
export class UsersModule {}
```

Agora um substituto `mockRepository` será usado como `UsersRepository`. Sempre que qualquer classe pede `UsersRepository` usando um decorador `@InjectRepository()`, Nest usará o objeto `mockRepository` registrado.

#### Async configuration

(Configuração assíncrona)

Você pode querer passar suas opções de módulo de repositório de forma assíncrona em vez de estaticamente. Nesse caso, use o método `forRootAsync()`, que fornece várias maneiras de lidar com a configuração assíncrona.

Uma abordagem é usar uma função de fábrica:

```typescript
TypeOrmModule.forRootAsync({
 useFactory: () => ({
   type: 'mysql',
   host: 'localhost',
   port: 3306,
   username: 'root',
   password: 'root',
   database: 'test',
   entities: [],
   synchronize: true,
 }),
});
```

Nossa fábrica se comporta como qualquer outro [provedor assíncrono](https://docs.nestjs.com/fundamentals/async-providers) (por exemplo, pode ser `async` e é capaz de injetar dependências através de `inject`).

```typescript
TypeOrmModule.forRootAsync({
 imports: [ConfigModule],
 useFactory: (configService: ConfigService) => ({
   type: 'mysql',
   host: configService.get('HOST'),
   port: +configService.get('PORT'),
   username: configService.get('USERNAME'),
   password: configService.get('PASSWORD'),
   database: configService.get('DATABASE'),
   entities: [],
   synchronize: true,
 }),
 inject: [ConfigService],
});
```

Alternativamente, você pode usar a sintaxe `useClass`:

```typescript
TypeOrmModule.forRootAsync({
 useClass: TypeOrmConfigService,
});
```

A construção acima irá instanciar `TypeOrmConfigService` dentro de `TypeOrmModule` e usá-lo para fornecer um objeto de opções chamando `createTypeOrmOptions()`. Observe que isso significa que o `TypeOrmConfigService` precisa implementar a interface `TypeOrmOptionsFactory`, conforme mostrado abaixo:

```typescript
@Injectable()
class TypeOrmConfigService implements TypeOrmOptionsFactory {
 createTypeOrmOptions(): TypeOrmModuleOptions {
   return {
     type: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     entities: [],
     synchronize: true,
   };
 }
}
```

Para evitar a criação de `TypeOrmConfigService` dentro de `TypeOrmModule` e usar um provedor importado de um módulo diferente, você pode usar a sintaxe `useExisting`.

```typescript
TypeOrmModule.forRootAsync({
 imports: [ConfigModule],
 useExisting: ConfigService,
});
```

Esta construção funciona da mesma forma que `useClass` com uma diferença crítica - `TypeOrmModule` pesquisará módulos importados para reutilizar um `ConfigService` existente em vez de instanciar um novo.

> info **Dica** Certifique-se de que a propriedade `name` esteja definida no mesmo nível que a propriedade `useFactory`, `useClass` ou `useValue`. Isso permitirá que o Nest registre corretamente a fonte de dados no token de injeção apropriado.

#### Custom DataSource Factory

(Fábrica de fonte de dados personalizada)

Em conjunto com a configuração assíncrona usando `useFactory`, `useClass` ou `useExisting`, você pode opcionalmente especificar uma função `dataSourceFactory` que permitirá que você forneça sua própria fonte de dados TypeORM em vez de permitir que `TypeOrmModule` crie a fonte de dados .

`dataSourceFactory` recebe o TypeORM `DataSourceOptions` configurado durante a configuração assíncrona usando `useFactory`, `useClass` ou `useExisting` e retorna um `Promise` que resolve um TypeORM `DataSource`.


```typescript
TypeOrmModule.forRootAsync({
 imports: [ConfigModule],
 inject: [ConfigService],
 // Use useFactory, useClass, or useExisting
 // to configure the DataSourceOptions.
 useFactory: (configService: ConfigService) => ({
   type: 'mysql',
   host: configService.get('HOST'),
   port: +configService.get('PORT'),
   username: configService.get('USERNAME'),
   password: configService.get('PASSWORD'),
   database: configService.get('DATABASE'),
   entities: [],
   synchronize: true,
 }),
 // dataSource receives the configured DataSourceOptions
 // and returns a Promise<DataSource>.
 dataSourceFactory: async (options) => {
   const dataSource = await new DataSource(options).initialize();
   return dataSource;
 },
});
```

> info **Dica** A classe `DataSource` é importada do pacote `typeorm`.

#### Example

(Exemplo)

Um exemplo funcional está disponível [aqui](https://github.com/nestjs/nest/tree/master/sample/05-sql-typeorm).

<app-banner-enterprise></app-banner-enterprise>

### Sequelize Integration

(Integração Sequelize)

Uma alternativa ao uso do TypeORM é usar o ORM [Sequelize](https://sequelize.org/) com o pacote `@nestjs/sequelize`. Além disso, aproveitamos o pacote [sequelize-typescript](https://github.com/RobinBuschmann/sequelize-typescript) que fornece um conjunto de decoradores adicionais para definir entidades declarativamente.

Para começar a usá-lo, primeiro instalamos as dependências necessárias. Neste capítulo, demonstraremos o uso do popular [MySQL](https://www.mysql.com/) DBMS Relacional, mas o Sequelize fornece suporte para muitos bancos de dados relacionais, como PostgreSQL, MySQL, Microsoft SQL Server, SQLite, e MariaDB. O procedimento que percorremos neste capítulo será o mesmo para qualquer banco de dados suportado pelo Sequelize. Você simplesmente precisará instalar as bibliotecas de API do cliente associadas para o banco de dados selecionado.


```bash
$ npm install --save @nestjs/sequelize sequelize sequelize-typescript mysql2
$ npm install --save-dev @types/sequelize
```

Quando o processo de instalação estiver concluído, podemos importar o `SequelizeModule` para a raiz `AppModule`.

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
 imports: [
   SequelizeModule.forRoot({
     dialect: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     models: [],
   }),
 ],
})
export class AppModule {}
```

O método `forRoot()` suporta todas as propriedades de configuração expostas pelo construtor Sequelize ([leia mais](https://sequelize.org/v5/manual/getting-started.html#setting-up-a-connection)) . Além disso, existem várias propriedades de configuração extra descritas abaixo.

<table>
 <tr>
   <td><code>retryAttempts</code></td>
   <td>Número de tentativas de conexão com o banco de dados (padrão: <code>10</code>)</td>
 </tr>
 <tr>
   <td><code>retryDelay</code></td>
   <td>Atraso entre tentativas de conexão (ms) (padrão: <code>3000</code>)</td>
 </tr>
 <tr>
   <td><code>autoLoadModels</code></td>
   <td>Se <code>true</code>, os modelos serão carregados automaticamente (padrão: <code>false</code>)</td>
 </tr>
 <tr>
   <td><code>keepConnectionAlive</code></td>
   <td>Se <code>true</code>, a conexão não será fechada no desligamento do aplicativo (padrão: <code>false</code>)</td>
 </tr>
 <tr>
   <td><code>sincronizar</code></td>
   <td>Se <code>true</code>, os modelos carregados automaticamente serão sincronizados (padrão: <code>true</code>)</td>
 </tr>
</table>

Feito isso, o objeto `Sequelize` estará disponível para injetar em todo o projeto (sem precisar importar nenhum módulo), por exemplo:


```typescript
@@filename(app.service)
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Injectable()
export class AppService {
 constructor(private sequelize: Sequelize) {}
}
@@switch
import { Injectable } from '@nestjs/common';
import { Sequelize } from 'sequelize-typescript';

@Dependencies(Sequelize)
@Injectable()
export class AppService {
 constructor(sequelize) {
   this.sequelize = sequelize;
 }
}
```

#### Models

(Modelos)

Sequelize implementa o padrão Active Record. Com esse padrão, você usa classes de modelo diretamente para interagir com o banco de dados. Para continuar o exemplo, precisamos de pelo menos um modelo. Vamos definir o modelo `User`.

```typescript
@@filename(user.model)
import { Column, Model, Table } from 'sequelize-typescript';

@Table
export class User extends Model {
 @Column
 firstName: string;

 @Column
 lastName: string;

 @Column({ defaultValue: true })
 isActive: boolean;
}
```

> info **Dica** Saiba mais sobre os decoradores disponíveis [aqui](https://github.com/RobinBuschmann/sequelize-typescript#column).

O arquivo de modelo `User` fica no diretório `users`. Este diretório contém todos os arquivos relacionados ao `UsersModule`. Você pode decidir onde manter seus arquivos de modelo, no entanto, recomendamos criá-los perto de seu **domínio**, no diretório do módulo correspondente.

Para começar a usar o modelo `User`, precisamos informar o Sequelize sobre ele inserindo-o no array `models` nas opções do método `forRoot()` do módulo:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './users/user.model';

@Module({
 imports: [
   SequelizeModule.forRoot({
     dialect: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     models: [User],
   }),
 ],
})
export class AppModule {}
```

Em seguida, vamos ver o `UsersModule`:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.model';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';

@Module({
 imports: [SequelizeModule.forFeature([User])],
 providers: [UsersService],
 controllers: [UsersController],
})
export class UsersModule {}
```

Este módulo usa o método `forFeature()` para definir quais modelos são registrados no escopo atual. Com isso no lugar, podemos injetar o `UserModel` no `UsersService` usando o decorador `@InjectModel()`:

```typescript
@@filename(users.service)
import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
export class UsersService {
 constructor(
   @InjectModel(User)
   private userModel: typeof User,
 ) {}

 async findAll(): Promise<User[]> {
   return this.userModel.findAll();
 }

 findOne(id: string): Promise<User> {
   return this.userModel.findOne({
     where: {
       id,
     },
   });
 }

 async remove(id: string): Promise<void> {
   const user = await this.findOne(id);
   await user.destroy();
 }
}
@@switch
import { Injectable, Dependencies } from '@nestjs/common';
import { getModelToken } from '@nestjs/sequelize';
import { User } from './user.model';

@Injectable()
@Dependencies(getModelToken(User))
export class UsersService {
 constructor(usersRepository) {
   this.usersRepository = usersRepository;
 }

 async findAll() {
   return this.userModel.findAll();
 }

 findOne(id) {
   return this.userModel.findOne({
     where: {
       id,
     },
   });
 }

 async remove(id) {
   const user = await this.findOne(id);
   await user.destroy();
 }
}
```

> warning **Aviso** Não se esqueça de importar o `UsersModule` para o `AppModule` raiz.

Se você quiser usar o repositório fora do módulo que importa `SequelizeModule.forFeature`, você precisará reexportar os provedores gerados por ele.
Você pode fazer isso exportando o módulo inteiro, assim:

```typescript
@@filename(users.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { User } from './user.entity';

@Module({
 imports: [SequelizeModule.forFeature([User])],
 exports: [SequelizeModule]
})
export class UsersModule {}
```

Agora, se importarmos `UsersModule` em `UserHttpModule`, podemos usar `@InjectModel(User)` nos provedores do último módulo.

```typescript
@@filename(users-http.module)
import { Module } from '@nestjs/common';
import { UsersModule } from './users.module';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';

@Module({
 imports: [UsersModule],
 providers: [UsersService],
 controllers: [UsersController]
})
export class UserHttpModule {}
```

#### Relations

(Relações)

Relações são associações estabelecidas entre duas ou mais tabelas. As relações são baseadas em campos comuns de cada tabela, geralmente envolvendo chaves primárias e estrangeiras.

Existem três tipos de relações:

<table>
  <tr>
    <td><code>Um para um</code></td>
    <td>Cada linha na tabela primária tem uma e apenas uma linha associada na tabela estrangeira</td>
  </tr>
  <tr>
    <td><code>Um para muitos / Muitos para um</code></td>
    <td>Cada linha na tabela primária tem uma ou mais linhas relacionadas na tabela estrangeira</td>
  </tr>
  <tr>
    <td><code>Muitos para muitos</code></td>
    <td>Cada linha na tabela primária tem muitas linhas relacionadas na tabela estrangeira, e cada registro na tabela estrangeira tem muitas linhas relacionadas na tabela primária</td>
  </tr>
</table>

Para definir relações em entidades, use os **decoradores** correspondentes. Por exemplo, para definir que cada `User` pode ter várias fotos, use o decorador `@HasMany()`.

```typescript
@@filename(user.entity)
import { Column, Model, Table, HasMany } from 'sequelize-typescript';
import { Photo } from '../photos/photo.model';

@Table
export class User extends Model {
 @Column
 firstName: string;

 @Column
 lastName: string;

 @Column({ defaultValue: true })
 isActive: boolean;

 @HasMany(() => Photo)
 photos: Photo[];
}
```

> info **Dica** Para saber mais sobre associações no Sequelize, leia [este](https://github.com/RobinBuschmann/sequelize-typescript#model-association) capítulo.

#### Auto-load models

(Modelos de carregamento automático)

A adição manual de modelos ao array `models` das opções de conexão pode ser tedioso. Além disso, os modelos de referência do módulo raiz quebram os limites do domínio do aplicativo e causam vazamento de detalhes de implementação para outras partes do aplicativo. Para resolver esse problema, carregue modelos automaticamente definindo as propriedades `autoLoadModels` e `synchronize` do objeto de configuração (passado para o método `forRoot()`) como `true`, conforme mostrado abaixo:

```typescript
@@filename(app.module)
import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';

@Module({
 imports: [
   SequelizeModule.forRoot({
     ...
     autoLoadModels: true,
     synchronize: true,
   }),
 ],
})
export class AppModule {}
```

Com essa opção especificada, todo modelo registrado através do método `forFeature()` será automaticamente adicionado ao array `models` do objeto de configuração.

> warning **Aviso** Observe que os modelos que não são registrados através do método `forFeature()`, mas são apenas referenciados a partir do modelo (através de uma associação), não serão incluídos.


#### Transactions

(Transações)

Uma transação de banco de dados simboliza uma unidade de trabalho realizada dentro de um sistema de gerenciamento de banco de dados em relação a um banco de dados e tratada de maneira coerente e confiável, independente de outras transações. Uma transação geralmente representa qualquer alteração em um banco de dados ([saiba mais](https://en.wikipedia.org/wiki/Database_transaction)).

Existem muitas estratégias diferentes para lidar com [Sequelize transações](https://sequelize.org/v5/manual/transactions.html). Abaixo está um exemplo de implementação de uma transação gerenciada (retorno de chamada automático).

Primeiro, precisamos injetar o objeto `Sequelize` em uma classe da maneira normal:

```typescript
@Injectable()
export class UsersService {
 constructor(private sequelize: Sequelize) {}
}
```

> info **Dica** A classe `Sequelize` é importada do pacote `sequelize-typescript`.

Agora, podemos usar este objeto para criar uma transação.

```typescript
async createMany() {
 try {
   await this.sequelize.transaction(async t => {
     const transactionHost = { transaction: t };

     await this.userModel.create(
         { firstName: 'Abraham', lastName: 'Lincoln' },
         transactionHost,
     );
     await this.userModel.create(
         { firstName: 'John', lastName: 'Boothe' },
         transactionHost,
     );
   });
 } catch (err) {
   // Transaction has been rolled back
   // err is whatever rejected the promise chain returned to the transaction callback
 }
}
```

> info **Dica** Observe que a instância `Sequelize` é usada apenas para iniciar a transação. No entanto, para testar esta classe seria necessário zombar de todo o objeto `Sequelize` (que expõe vários métodos). Assim, recomendamos usar uma classe de fábrica auxiliar (por exemplo, `TransactionRunner`) e definir uma interface com um conjunto limitado de métodos necessários para manter as transações. Essa técnica torna a zombaria desses métodos bastante simples.

#### Migrations

(Migrações)

[Migrations](https://sequelize.org/v5/manual/migrations.html) fornecem uma maneira de atualizar incrementalmente o esquema do banco de dados para mantê-lo sincronizado com o modelo de dados do aplicativo enquanto preserva os dados existentes no banco de dados. Para gerar, executar e reverter migrações, o Sequelize fornece uma [CLI](https://sequelize.org/v5/manual/migrations.html#the-cli) dedicada.

As classes de migração são separadas do código-fonte do aplicativo Nest. Seu ciclo de vida é mantido pela CLI do Sequelize. Portanto, você não pode aproveitar a injeção de dependência e outros recursos específicos do Nest com migrações. Para saber mais sobre migrações, siga o guia na [documentação do Sequelize](https://sequelize.org/v5/manual/migrations.html#the-cli).

<app-banner-courses></app-banner-courses>

#### Multiple databases

(Múltiplas bases de dados)

Alguns projetos exigem várias conexões de banco de dados. Isso também pode ser alcançado com este módulo. Para trabalhar com várias conexões, primeiro crie as conexões. Nesse caso, a nomenclatura da conexão se torna **obrigatória**.

Suponha que você tenha uma entidade `Album` armazenada em seu próprio banco de dados.

```typescript
const defaultOptions = {
 dialect: 'postgres',
 port: 5432,
 username: 'user',
 password: 'password',
 database: 'db',
 synchronize: true,
};

@Module({
 imports: [
   SequelizeModule.forRoot({
     ...defaultOptions,
     host: 'user_db_host',
     models: [User],
   }),
   SequelizeModule.forRoot({
     ...defaultOptions,
     name: 'albumsConnection',
     host: 'album_db_host',
     models: [Album],
   }),
 ],
})
export class AppModule {}
```

> warning **Aviso** Se você não definir o `name` para uma conexão, seu nome será definido como `default`. Observe que você não deve ter várias conexões sem nome ou com o mesmo nome, caso contrário elas serão substituídas.

Neste ponto, você tem modelos `User` e `Album` registrados com sua própria conexão. Com esta configuração, você tem que dizer ao método `SequelizeModule.forFeature()` e ao decorador `@InjectModel()` qual conexão deve ser usada. Se você não passar nenhum nome de conexão, a conexão `default` é usada.

```typescript
@Module({
 imports: [
   SequelizeModule.forFeature([User]),
   SequelizeModule.forFeature([Album], 'albumsConnection'),
 ],
})
export class AppModule {}
```

Você também pode injetar a instância `Sequelize` para uma determinada conexão:

```typescript
@Injectable()
export class AlbumsService {
 constructor(
   @InjectConnection('albumsConnection')
   private sequelize: Sequelize,
 ) {}
}
```

Também é possível injetar qualquer instância `Sequelize` nos provedores:

```typescript
@Module({
 providers: [
   {
     provide: AlbumsService,
     useFactory: (albumsSequelize: Sequelize) => {
       return new AlbumsService(albumsSequelize);
     },
     inject: [getConnectionToken('albumsConnection')],
   },
 ],
})
export class AlbumsModule {}
```

#### Testing

(Teste)

Quando se trata de teste de unidade de um aplicativo, geralmente queremos evitar fazer uma conexão com o banco de dados, mantendo nossos conjuntos de testes independentes e seu processo de execução o mais rápido possível. Mas nossas classes podem depender de modelos que são extraídos da instância de conexão. Como lidamos com isso? A solução é criar modelos simulados. Para conseguir isso, configuramos [provedores personalizados](/fundamentals/custom-providers). Cada modelo registrado é automaticamente representado por um token `<ModelName>Model`, onde `ModelName` é o nome de sua classe de modelo.

O pacote `@nestjs/sequelize` expõe a função `getModelToken()` que retorna um token preparado com base em um determinado modelo.

```typescript
@Module({
 providers: [
   UsersService,
   {
     provide: getModelToken(User),
     useValue: mockModel,
   },
 ],
})
export class UsersModule {}
```

Agora um substituto `mockModel` será usado como `UserModel`. Sempre que qualquer classe pede `UserModel` usando um decorador `@InjectModel()`, Nest usará o objeto `mockModel` registrado.

#### Async configuration

(Configuração assíncrona)

Você pode querer passar suas opções `SequelizeModule` de forma assíncrona ao invés de estaticamente. Nesse caso, use o método `forRootAsync()`, que fornece várias maneiras de lidar com a configuração assíncrona.

Uma abordagem é usar uma função de fábrica:

```typescript
SequelizeModule.forRootAsync({
 useFactory: () => ({
   dialect: 'mysql',
   host: 'localhost',
   port: 3306,
   username: 'root',
   password: 'root',
   database: 'test',
   models: [],
 }),
});
```

Nossa fábrica se comporta como qualquer outro [provedor assíncrono](https://docs.nestjs.com/fundamentals/async-providers) (por exemplo, pode ser `async` e é capaz de injetar dependências através de `inject`).

```typescript
SequelizeModule.forRootAsync({
 imports: [ConfigModule],
 useFactory: (configService: ConfigService) => ({
   dialect: 'mysql',
   host: configService.get('HOST'),
   port: +configService.get('PORT'),
   username: configService.get('USERNAME'),
   password: configService.get('PASSWORD'),
   database: configService.get('DATABASE'),
   models: [],
 }),
 inject: [ConfigService],
});
```

Alternativamente, você pode usar a sintaxe `useClass`:

```typescript
SequelizeModule.forRootAsync({
 useClass: SequelizeConfigService,
});
```

A construção acima irá instanciar `SequelizeConfigService` dentro de `SequelizeModule` e usá-lo para fornecer um objeto de opções chamando `createSequelizeOptions()`. Observe que isso significa que o `SequelizeConfigService` precisa implementar a interface `SequelizeOptionsFactory`, conforme mostrado abaixo:

```typescript
@Injectable()
class SequelizeConfigService implements SequelizeOptionsFactory {
 createSequelizeOptions(): SequelizeModuleOptions {
   return {
     dialect: 'mysql',
     host: 'localhost',
     port: 3306,
     username: 'root',
     password: 'root',
     database: 'test',
     models: [],
   };
 }
}
```

Para evitar a criação de `SequelizeConfigService` dentro de `SequelizeModule` e usar um provedor importado de um módulo diferente, você pode usar a sintaxe `useExisting`.

```typescript
SequelizeModule.forRootAsync({
 imports: [ConfigModule],
 useExisting: ConfigService,
});
```

Esta construção funciona da mesma forma que `useClass` com uma diferença crítica - `SequelizeModule` pesquisará módulos importados para reutilizar um `ConfigService` existente em vez de instanciar um novo.

#### Example

(Exemplo)

Um exemplo funcional está disponível [aqui](https://github.com/nestjs/nest/tree/master/sample/07-sequelize).
