import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hierarchical-injector',
  templateUrl: './hierarchical-injector.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HierarchicalInjectorComponent extends BasePageComponent {
  get coreModule() {
    return `
@Module({
  imports: [CommonModule],
  components: [CoreService, ContextService],
})
export class CoreModule {}`;
  }

  get commonModule() {
    return `
@Module({
  components: [CommonService],
  exports: [CommonService],
})
export class CommonModule {}`;
  }

  get contextService() {
    return `
@Component()
export class ContextService {
  constructor(private readonly commonService: CommonService) {}
}`;
  }

  get contextServiceJs() {
    return `
@Component()
@Dependencies(CommonService)
export class ContextService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}`;
  }

  get commonService() {
    return `
@Component()
export class CommonService {
  constructor(private readonly coreService: CoreService) {}
}`;
  }

  get commonServiceJs() {
    return `
@Component()
@Dependencies(CoreService)
export class CommonService {
  constructor(coreService) {
    this.coreService = coreService;
  }
}`;
  }
}
