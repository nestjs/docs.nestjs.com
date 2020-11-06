import {
  ChangeDetectionStrategy,
  Component,
  Input,
  OnInit
} from '@angular/core';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';

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
          title: 'Dynamic modules',
          path: '/fundamentals/dynamic-modules',
        },
        {
          title: 'Injection scopes',
          path: '/fundamentals/injection-scopes',
        },
        {
          title: 'Circular dependency',
          path: '/fundamentals/circular-dependency',
        },
        {
          title: 'Module reference',
          path: '/fundamentals/module-ref',
        },
        {
          title: 'Execution context',
          path: '/fundamentals/execution-context',
        },
        {
          title: 'Lifecycle events',
          path: '/fundamentals/lifecycle-events',
        },
        {
          title: 'Platform agnosticism',
          path: '/fundamentals/platform-agnosticism',
        },
        { title: 'Testing', path: '/fundamentals/testing' },
      ],
    },
    {
      title: 'Techniques',
      isOpened: false,
      children: [
        { title: 'Authentication', path: '/techniques/authentication' },
        { title: 'Database', path: '/techniques/database' },
        { title: 'Mongo', path: '/techniques/mongodb' },
        { title: 'Configuration', path: '/techniques/configuration' },
        { title: 'Validation', path: '/techniques/validation' },
        { title: 'Caching', path: '/techniques/caching' },
        { title: 'Serialization', path: '/techniques/serialization' },
        { title: 'Task scheduling', path: '/techniques/task-scheduling' },
        { title: 'Compression', path: '/techniques/compression' },
        { title: 'Security', path: '/techniques/security' },
        { title: 'Queues', path: '/techniques/queues' },
        { title: 'Logger', path: '/techniques/logger' },
        { title: 'File upload', path: '/techniques/file-upload' },
        { title: 'HTTP module', path: '/techniques/http-module' },
        { title: 'Model-View-Controller', path: '/techniques/mvc' },
        { title: 'Performance (Fastify)', path: '/techniques/performance' },
        { title: 'Server-Sent Events', path: '/techniques/server-sent-events' }
      ], 
    },
    {
      title: 'GraphQL',
      isOpened: false,
      children: [
        { title: 'Quick start', path: '/graphql/quick-start' },
        { title: 'Resolvers', path: '/graphql/resolvers' },
        { title: 'Mutations', path: '/graphql/mutations' },
        { title: 'Subscriptions', path: '/graphql/subscriptions' },
        { title: 'Scalars', path: '/graphql/scalars' },
        { title: 'Directives', path: '/graphql/directives' },
        { title: 'Plugins', path: '/graphql/plugins' },
        { title: 'Interfaces', path: '/graphql/interfaces' },
        { title: 'Unions', path: '/graphql/unions' },
        { title: 'Enums', path: '/graphql/enums' },
        { title: 'Mapped types', path: '/graphql/mapped-types' },
        { title: 'Complexity', path: '/graphql/complexity' },
        { title: 'Extensions', path: '/graphql/extensions' },
        { title: 'CLI Plugin', path: '/graphql/cli-plugin' },
        { title: 'Generating SDL', path: '/graphql/generating-sdl' },
        {
          title: 'Other features',
          path: '/graphql/other-features',
        },
        { title: 'Federation', path: '/graphql/federation' },
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
        { title: 'Overview', path: '/microservices/basics' },
        { title: 'Redis', path: '/microservices/redis' },
        { title: 'MQTT', path: '/microservices/mqtt' },
        { title: 'NATS', path: '/microservices/nats' },
        { title: 'RabbitMQ', path: '/microservices/rabbitmq' },
        { title: 'Kafka', path: '/microservices/kafka' },
        { title: 'gRPC', path: '/microservices/grpc' },
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
      title: 'Standalone apps',
      isOpened: false,
      path: '/application-context',
    },
    {
      title: 'CLI',
      isOpened: false,
      children: [
        { title: 'Overview', path: '/cli/overview' },
        { title: 'Workspaces', path: '/cli/monorepo' },
        { title: 'Libraries', path: '/cli/libraries' },
        { title: 'Usage', path: '/cli/usages' },
        { title: 'Scripts', path: '/cli/scripts' },
      ],
    },
    {
      title: 'OpenAPI',
      isOpened: false,
      children: [
        { title: 'Introduction', path: '/openapi/introduction' },
        {
          title: 'Model schema',
          path: '/openapi/model-schema',
        },
        { title: 'Operations', path: '/openapi/operations' },
        { title: 'Security', path: '/openapi/security' },
        { title: 'Mapped Types', path: '/openapi/mapped-types' },
        { title: 'Decorators', path: '/openapi/decorators' },
        { title: 'CLI Plugin', path: '/openapi/cli-plugin' },
        { title: 'Other features', path: '/openapi/other-features' },
        { title: 'Migration guide', path: '/openapi/migration-guide' },
      ],
    },
    {
      title: 'Recipes',
      isOpened: false,
      children: [
        { title: 'TypeORM', path: '/recipes/sql-typeorm' },
        { title: 'Mongoose', path: '/recipes/mongodb' },
        { title: 'Sequelize', path: '/recipes/sql-sequelize' },
        { title: 'OpenAPI (Swagger)', path: '/recipes/swagger' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'Prisma', path: '/recipes/prisma' },
        { title: 'Health checks (Terminus)', path: '/recipes/terminus' },
        { title: 'Documentation', path: '/recipes/documentation' },
        { title: 'Hot reload', path: '/recipes/hot-reload' },
        { title: 'Serve static', path: '/recipes/serve-static' },
      ],
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'HTTP adapter', path: '/faq/http-adapter' },
        { title: 'Global path prefix', path: '/faq/global-prefix' },
        { title: 'Hybrid application', path: '/faq/hybrid-application' },
        { title: 'HTTPS & multiple servers', path: '/faq/multiple-servers' },
        { title: 'Request lifecycle', path: '/faq/request-lifecycle' },
        {
          title: 'Examples',
          externalUrl: 'https://github.com/nestjs/nest/tree/master/sample',
        },
      ],
    },
    {
      title: 'Migration guide',
      isOpened: false,
      path: '/migration-guide',
    },
    {
      title: 'Official courses',
      externalUrl: 'https://courses.nestjs.com/',
    },
    {
      title: 'Discover',
      isOpened: false,
      children: [{ title: 'Who is using Nest?', path: '/discover/companies' }],
    },
    {
      title: 'T-Shirts and Hoodies',
      externalUrl: 'https://nestjs.threadless.com/',
    },
    {
      title: 'Support us',
      isOpened: false,
      path: '/support',
    },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
  ) {}

  ngOnInit() {
    this.router.events
      .pipe(filter((ev) => ev instanceof NavigationEnd))
      .subscribe((event) => this.toggleCategory());

    this.toggleCategory();
  }

  toggleCategory() {
    const { firstChild } = this.route.snapshot;
    if (
      (firstChild.url && firstChild.url[1]) ||
      (firstChild.url &&
        firstChild.routeConfig &&
        firstChild.routeConfig.loadChildren)
    ) {
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
