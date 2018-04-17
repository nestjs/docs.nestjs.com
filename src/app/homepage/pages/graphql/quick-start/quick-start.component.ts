import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-quick-start',
  templateUrl: './quick-start.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class QuickStartComponent extends BasePageComponent {
  get middleware() {
    return `
import { Module, MiddlewaresConsumer, NestModule } from '@nestjs/common';
import { graphqlExpress } from 'apollo-server-express';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [GraphQLModule],
})
export class ApplicationModule implements NestModule {
  configure(consumer: MiddlewaresConsumer) {
    consumer
      .apply(graphqlExpress(req => ({ schema: {}, rootValue: req })))
      .forRoutes('/graphql');
  }
}`;
  }

  get middlewareJs() {
    return `
import { Module } from '@nestjs/common';
import { graphqlExpress } from 'apollo-server-express';
import { GraphQLModule } from '@nestjs/graphql';

@Module({
  imports: [GraphQLModule],
})
export class ApplicationModule {
  configure(consumer) {
    consumer
      .apply(graphqlExpress(req => ({ schema: {}, rootValue: req })))
      .forRoutes('/graphql');
  }
}`;
  }

  get createSchema() {
    return `
import { Module, MiddlewaresConsumer, NestModule } from '@nestjs/common';
import { graphqlExpress } from 'apollo-server-express';
import { GraphQLModule, GraphQLFactory } from '@nestjs/graphql';

@Module({
  imports: [GraphQLModule],
})
export class ApplicationModule implements NestModule {
  constructor(private readonly graphQLFactory: GraphQLFactory) {}

  configure(consumer: MiddlewaresConsumer) {
    const typeDefs = this.graphQLFactory.mergeTypesByPaths('./**/*.graphql');
    const schema = this.graphQLFactory.createSchema({ typeDefs });

    consumer
      .apply(graphqlExpress(req => ({ schema, rootValue: req })))
      .forRoutes('/graphql');
  }
}`;
  }

  get createSchemaJs() {
    return `
import { Module } from '@nestjs/common';
import { graphqlExpress } from 'apollo-server-express';
import { GraphQLModule, GraphQLFactory } from '@nestjs/graphql';

@Dependencies(GraphQLFactory)
@Module({
  imports: [GraphQLModule],
})
export class ApplicationModule {
  constructor(graphQLFactory) {
    this.graphQLFactory = graphQLFactory;
  }

  configure(consumer) {
    const typeDefs = this.graphQLFactory.mergeTypesByPaths('./**/*.graphql');
    const schema = this.graphQLFactory.createSchema({ typeDefs });

    consumer
      .apply(graphqlExpress(req => ({ schema, rootValue: req })))
      .forRoutes('/graphql');
  }
}`;
  }
}
