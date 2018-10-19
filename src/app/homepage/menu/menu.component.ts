import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit,
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MenuComponent implements OnInit {
  @Input()
  isSidebarOpened = true;
  readonly items = [
    {
      title: 'Introduction',
      isOpened: false,
      path: '/',
    },
    {
      title: 'Overview',
      isOpened: true,
      children: [
        { title: 'First steps', path: '/first-steps' },
        { title: 'Controllers', path: '/controllers' },
        { title: 'Providers', path: '/providers' },
        { title: 'Modules', path: '/modules' },
        { title: 'Middleware', path: '/middleware' },
        { title: 'Exception filters', path: '/exception-filters' },
        { title: 'Pipes', path: '/pipes' },
        { title: 'Guards', path: '/guards' },
        { title: 'Interceptors', path: '/interceptors' },
        { title: 'Custom decorators', path: '/custom-decorators' },
      ],
    },
    {
      title: 'Fundamentals',
      isOpened: false,
      children: [
        { title: 'Custom providers', path: '/fundamentals/custom-providers' },
        {
          title: 'Asynchronous providers',
          path: '/fundamentals/async-providers',
        },
        {
          title: 'Circular dependency',
          path: '/fundamentals/circular-dependency',
        },
        {
          title: 'Platform agnosticism',
          path: '/fundamentals/platform-agnosticism',
        },
        { title: 'Testing', path: '/fundamentals/unit-testing' },
      ],
    },
    {
      title: 'Techniques',
      isOpened: false,
      children: [
        { title: 'Authentication', path: '/techniques/authentication' },
        { title: 'Database', path: '/techniques/database' },
        { title: 'Mongo', path: '/techniques/mongodb' },
        { title: 'File upload', path: '/techniques/file-upload' },
        { title: 'Validation', path: '/techniques/validation' },
        { title: 'Caching', path: '/techniques/caching' },
        { title: 'Serialization', path: '/techniques/serialization' },
        { title: 'Logger', path: '/techniques/logger' },
        { title: 'Security', path: '/techniques/security' },
        { title: 'Configuration', path: '/techniques/configuration' },
        { title: 'Compression', path: '/techniques/compression' },
        { title: 'HTTP module', path: '/techniques/http-module' },
        { title: 'Model-View-Controller', path: '/techniques/mvc' },
        { title: 'Performance (Fastify)', path: '/techniques/performance' },
        { title: 'Hot reload (Webpack)', path: '/techniques/hot-reload' },
      ],
    },
    {
      title: 'GraphQL',
      isOpened: false,
      children: [
        { title: 'Quick start', path: '/graphql/quick-start' },
        { title: 'Resolvers', path: '/graphql/resolvers-map' },
        { title: 'Mutations', path: '/graphql/mutations' },
        { title: 'Subscriptions', path: '/graphql/subscriptions' },
        { title: 'Scalars', path: '/graphql/scalars' },
        {
          title: 'Tooling',
          path: '/graphql/tooling',
        },
        // { title: 'Schema stitching', path: '/graphql/schema-stitching' },
      ],
    },
    {
      title: 'WebSockets',
      isOpened: false,
      children: [
        { title: 'Gateways', path: '/websockets/gateways' },
        { title: 'Exception filters', path: '/websockets/exception-filters' },
        { title: 'Pipes', path: '/websockets/pipes' },
        { title: 'Guards', path: '/websockets/guards' },
        { title: 'Interceptors', path: '/websockets/interceptors' },
        { title: 'Adapters', path: '/websockets/adapter' },
      ],
    },
    {
      title: 'Microservices',
      isOpened: false,
      children: [
        { title: 'Basics', path: '/microservices/basics' },
        { title: 'Redis', path: '/microservices/redis' },
        { title: 'MQTT', path: '/microservices/mqtt' },
        { title: 'NATS', path: '/microservices/nats' },
        { title: 'gRPC', path: '/microservices/grpc' },
        { title: 'RabbitMQ', path: '/microservices/rabbitmq' },
        {
          title: 'Exception filters',
          path: '/microservices/exception-filters',
        },
        { title: 'Pipes', path: '/microservices/pipes' },
        { title: 'Guards', path: '/microservices/guards' },
        { title: 'Interceptors', path: '/microservices/interceptors' },
      ],
    },
    {
      title: 'Execution context',
      isOpened: false,
      path: '/execution-context',
    },
    {
      title: 'Recipes',
      isOpened: false,
      children: [
        { title: 'TypeORM', path: '/recipes/sql-typeorm' },
        { title: 'Mongoose', path: '/recipes/mongodb' },
        { title: 'Sequelize', path: '/recipes/sql-sequelize' },
        // { title: 'Authentication (Passport)', path: '/recipes/passport' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'OpenAPI (Swagger)', path: '/recipes/swagger' },
        { title: 'Prisma', path:'/recipes/prisma' }
      ],
    },
    {
      title: 'CLI',
      isOpened: false,
      children: [
        { title: 'Overview', path: '/cli/overview' },
        { title: 'Usage', path: '/cli/usages' },
      ],
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'Express instance', path: '/faq/express-instance' },
        { title: 'Global path prefix', path: '/faq/global-prefix' },
        { title: 'Lifecycle events', path: '/faq/lifecycle-events' },
        { title: 'Hybrid application', path: '/faq/hybrid-application' },
        { title: 'HTTPS & multiple servers', path: '/faq/multiple-servers' },
        {
          title: 'Examples',
          externalUrl:
            'https://github.com/kamilmysliwiec/nest/tree/master/sample',
        },
      ],
    },
    {
      title: 'Discover',
      isOpened: false,
      children: [{ title: 'Who is using Nest?', path: '/discover/companies' }],
    },
    {
      title: 'Migration guide',
      isOpened: false,
      path: '/migration-guide',
    },
    {
      title: 'Support me',
      isOpened: false,
      path: '/support',
    },
    {
      title: 'Version 4',
      isOpened: false,
      externalUrl: 'https://docs.nestjs.com/v4/',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.router.events
      .filter(event => event instanceof NavigationEnd)
      .subscribe(event => this.toggleCategory());

    this.toggleCategory();
  }

  toggleCategory() {
    const { firstChild } = this.route.snapshot;
    if (firstChild.url && firstChild.url[1]) {
      const { path } = firstChild.url[0];
      const index = this.items.findIndex(
        ({ title }) => title.toLowerCase() === path,
      );
      if (index < 0) {
        return;
      }
      this.items[index].isOpened = true;
      this.items[1].isOpened = false;
    }
  }
}
