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
      ]
    },
    {
      title: 'Advanced',
      isOpened: false,
      children: [
        { title: 'Dependency Injection', path: '/advanced/dependency-injection' },
        { title: 'Async Components', path: '/advanced/async-components' },
        { title: 'Hierarchical Injector', path: '/advanced/hierarchical-injector' },
        { title: 'Mixin Class', path: '/advanced/mixins' },
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
      title: 'Recipes',
      isOpened: false,
      children: [
        { title: 'SQL (TypeORM)', path: '/recipes/sql-typeorm' },
        { title: 'MongoDB (Mongoose)', path: '/recipes/mongodb' },
        { title: 'SQL (Sequelize)', path: '/recipes/sql-sequelize' },
        { title: 'Passport integration', path: '/recipes/passport' },
        { title: 'CQRS', path: '/recipes/cqrs' },
        { title: 'Swagger', path: '/recipes/swagger', isPending: true },
        { title: 'GraphQL', path: '/recipes/graphql', isPending: true }
      ],
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
