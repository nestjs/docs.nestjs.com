import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-modules',
  templateUrl: './modules.component.html',
  styleUrls: ['./modules.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ModulesComponent extends BasePageComponent {
  get catsModule() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
    controllers: [CatsController],
    components: [CatsService],
})
export class CatsModule {}
`;
  }

  get appModule() {
    return `
import { Module } from '@nestjs/common';
import { CatsModule } from './cats/cats.module';

@Module({
    modules: [CatsModule],
})
export class ApplicationModule {}
`;
  }

    get catsModuleShared() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
    controllers: [CatsController],
    components: [CatsService],
    exports: [CatsService]
})
export class CatsModule {}
`;
  }

  get singleScope() {
    return `
import { Module, SingleScope } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@SingleScope()
@Module({
    controllers: [CatsController],
    components: [CatsService],
    exports: [CatsService]
})
export class CatsModule {}`;
  }

  get catsModuleDi() {
    return `
import { Module } from '@nestjs/common';
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

@Module({
    controllers: [CatsController],
    components: [CatsService],
})
export class CatsModule {
  constructor(private readonly catsService: CatsService) {}
}`;
  }

  get reExportExamle() {
    return `
@Module({
  modules: [CommonModule],
  exports: [CommonModule],
})
export class CoreModule {}`;
  }
}
