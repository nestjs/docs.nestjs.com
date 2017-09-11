import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-hierarchical-injector',
  templateUrl: './hierarchical-injector.component.html',
  styleUrls: ['./hierarchical-injector.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class HierarchicalInjectorComponent extends BasePageComponent {
  get coreModule() {
    return `
@Module({
  modules: [CommonModule],
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

  get commonService() {
    return `
@Component()
export class CommonService {
  constructor(private readonly coreService: CoreService) {}
}`;
  }
}