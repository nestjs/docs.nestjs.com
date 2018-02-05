import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-nest-router',
  templateUrl: './nest-router.component.html',
  styleUrls: ['./nest-router.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NestRouterComponent extends BasePageComponent {

  get dependencies() {
    return `
$ npm install nest-router --save`;
  }

  get folderStructure() {
    return `
.
├── app.module.ts
├── cats
│   ├── cats.controller.ts
│   ├── cats.module.ts
│   └── ketty.controller.ts
├── dogs
│   ├── dogs.controller.ts
│   ├── dogs.module.ts
│   └── puppy.controller.ts
├── main.ts
└── ninja
    ├── katana.controller.ts
    ├── ninja.controller.ts
    └── ninja.module.ts`;
  }

  get routesTree() {
    return `
    ninja
    ├── /
    ├── /katana
    ├── cats
    │   ├── /
    │   └── /ketty
    ├── dogs
        ├── /
        └── /puppy`;
  }

  get setupModule() {
    return `
... //imports
import { RouterModule, Routes } from 'nest-router';

const routes: Routes = [
  {
    path: '/ninja',
    module: NinjaModule,
    children: {
      path: '/cats',
      module: CatsModule,
    },
  },
  {
    path: '/ninja',
    module: NinjaModule,
    children: {
      path: '/dogs',
      module: DogsModule,
    },
  },
];

@Module({
  imports: [
      RouterModule.forRoutes(routes), // setup the routes
      CatsModule,
      DogsModule,
      NinjaModule
      ], // as usual, nothing new
})
export class ApplicationModule {}`;
  }
}
