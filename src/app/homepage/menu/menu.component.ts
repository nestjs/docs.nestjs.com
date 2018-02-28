import { Component, Input, ChangeDetectionStrategy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent implements OnInit {
  @Input() isSidebarOpened = true;
  readonly items = [
    {
      title: 'Introduction',
      isOpened: false,
      path: '/'
    },
    {
      title: 'Overview',
      isOpened: true,
      children: [
        { title: 'First Steps', path: '/first-steps' },
        { title: 'Controllers', path: '/controllers' },
        { title: 'Components', path: '/components' },
        { title: 'Modules', path: '/modules' },
        { title: 'Middlewares', path: '/middlewares' },
        { title: 'Exception Filters', path: '/exception-filters' },
        { title: 'Pipes', path: '/pipes' },
        { title: 'Guards', path: '/guards' },
        { title: 'Interceptors', path: '/interceptors' },
        { title: 'Custom Decorators', path: '/custom-decorators' },
      ]
    },
    {
      title: 'Fundamentals',
      isOpened: false,
      children: [
        { title: 'Dependency Injection', path: '/fundamentals/dependency-injection' },
        { title: 'Async Components', path: '/fundamentals/async-components' },
        { title: 'Circular Dependency', path: '/fundamentals/circular-dependency' },
        { title: 'Unit Testing', path: '/fundamentals/unit-testing' },
        { title: 'E2E Testing', path: '/fundamentals/e2e-testing' },
      ]
    },
    {
      title: 'Techniques',
      isOpened: false,
      children: [
        { title: 'MVC', path: '/techniques/mvc' },
        { title: 'SQL', path: '/techniques/sql' },
        { title: 'MongoDB', path: '/techniques/mongodb' },
        { title: 'Authentication', path: '/techniques/authentication' },
      ]
    },
    {
      title: 'GraphQL',
      isOpened: false,
      children: [
        { title: 'Quick Start', path: '/graphql/quick-start' },
        { title: 'Resolvers Map', path: '/graphql/resolvers-map' },
        { title: 'Mutations', path: '/graphql/mutations' },
        { title: 'Subscriptions', path: '/graphql/subscriptions' },
        { title: 'Guards & Interceptors', path: '/graphql/guards-interceptors' },
        { title: 'Schema stitching', path: '/graphql/schema-stitching' },
        { title: 'IDE', path: '/graphql/ide' },
      ]
    },
    {
      title: 'WebSockets',
      isOpened: false,
      children: [
        { title: 'Gateways', path: '/websockets/gateways' },
        { title: 'Exception Filters', path: '/websockets/exception-filters' },
        { title: 'Pipes', path: '/websockets/pipes' },
        { title: 'Guards', path: '/websockets/guards' },
        { title: 'Interceptors', path: '/websockets/interceptors' },
        { title: 'Adapter', path: '/websockets/adapter' },
      ]
    },
    {
      title: 'Microservices',
      isOpened: false,
      children: [
        { title: 'Basics', path: '/microservices/basics' },
        { title: 'Redis', path: '/microservices/redis' },
        { title: 'Exception Filters', path: '/microservices/exception-filters' },
        { title: 'Pipes', path: '/microservices/pipes' },
        { title: 'Guards', path: '/microservices/guards' },
        { title: 'Interceptors', path: '/microservices/interceptors' },
        { title: 'Custom Transport', path: '/microservices/custom-transport' },
      ]
    },
    {
      title: 'Execution Context',
      isOpened: false,
      path: '/execution-context',
    },
    {
      title: 'Recipes',
      isOpened: false,
      children: [
        { title: 'SQL (TypeORM)', path: '/recipes/sql-typeorm' },
        { title: 'MongoDB (Mongoose)', path: '/recipes/mongodb' },
        { title: 'SQL (Sequelize)', path: '/recipes/sql-sequelize' },
        { title: 'Authentication (Passport)', path: '/recipes/passport' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'OpenAPI (Swagger)', path: '/recipes/swagger' },
        { title: 'MongoDB E2E (Mockgoose)', path: '/recipes/mockgoose' },
      ],
    },
    {
      title: 'Advanced',
      isOpened: false,
      children: [
        { title: 'Hierarchical Injector', path: '/advanced/hierarchical-injector' },
        { title: 'Mixin Class', path: '/advanced/mixins' },
      ]
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'Express Instance', path: '/faq/express-instance' },
        { title: 'Global Route Prefix', path: '/faq/global-prefix' },
        { title: 'Lifecycle Events', path: '/faq/lifecycle-events' },
        { title: 'Hybrid Application', path: '/faq/hybrid-application' },
        { title: 'HTTPS & Multiple Servers', path: '/faq/multiple-servers' },
        { title: 'Examples', externalUrl: 'https://github.com/kamilmysliwiec/nest/tree/master/examples' },
      ]
    },
    {
      title: 'Support me',
      isOpened: false,
      externalUrl: 'https://opencollective.com/nest',
    },
    {
      title: 'CLI',
      isOpened: false,
      path: '/cli'
    }
  ];

  constructor(private readonly route: ActivatedRoute) {}

  ngOnInit() {
    const { firstChild } = this.route.snapshot;
    if (firstChild.url && firstChild.url[1]) {
      const { path } = firstChild.url[0];
      const index = this.items.findIndex(({ title }) => title.toLowerCase() === path);
      if (index < 0) {
        return;
      }
      this.items[index].isOpened = true;
      this.items[1].isOpened = false;
    }
  }
}
