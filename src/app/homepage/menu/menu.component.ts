import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MenuComponent {
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
      ]
    },
    {
      title: 'Advanced',
      isOpened: false,
      children: [
        { title: 'Dependency Injection', path: '/advanced/dependency-injection' },
        { title: 'Async Components', path: '/advanced/async-components' },
        { title: 'Hierarchical Injector (TBC)', path: '/advanced/hierarchical-injector' },
        { title: 'Circular Dependency', path: '/advanced/circular-dependency' },
        { title: 'Unit Testing', path: '/advanced/unit-testing' },
        { title: 'E2E Testing', path: '/advanced/e2e-testing' },
      ]
    },
    {
      title: 'WebSockets',
      isOpened: false,
      children: [
        { title: 'Gateways', path: '/websockets/gateways' },
        { title: 'Pipes', path: '/websockets/pipes' },
        { title: 'Exception Filters', path: '/websockets/exception-filters' },
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
        { title: 'Pipes', path: '/microservices/pipes' },
        { title: 'Exception Filters', path: '/microservices/exception-filters' },
        { title: 'Guards', path: '/microservices/guards' },
        { title: 'Interceptors', path: '/microservices/interceptors' },
        { title: 'Custom Transport', path: '/microservices/custom-transport' },
      ]
    },
    {
      title: 'Recipes',
      isOpened: false,
      children: [
        { title: 'SQL (TypeORM)', path: '/recipes/sql-typeorm' },
        { title: 'MongoDB (TBC)', path: '/recipes/mongodb' },
        { title: 'CQRS + Event Sourcing (TBC)', path: '/recipes/cqrs' },
        { title: 'Passport integration (TBC)', path: '/recipes/passport' },
        { title: 'Swagger (TBC)', path: '/recipes/swagger' },
        { title: 'GraphQL (TBC)', path: '/recipes/graphql' }
      ],
    },
    {
      title: 'FAQ',
      isOpened: false,
      children: [
        { title: 'Best Practices (TBC)', path: '/faq/best-practices' },
        { title: 'Express Instance', path: '/faq/express-instance' },
        { title: 'Global Route Prefix', path: '/faq/global-prefix' },
        { title: 'Lifecycle Events', path: '/faq/lifecycle-events' },
        { title: 'Hybrid Application', path: '/faq/hybrid-application' },
        { title: 'Multiple Simultaneous Servers', path: '/faq/multiple-servers' },
        { title: 'Examples', path: '/faq/examples' },
      ]
    },
    {
      title: 'Support me',
      externalUrl: 'https://opencollective.com/nest',
    }
  ];
}
