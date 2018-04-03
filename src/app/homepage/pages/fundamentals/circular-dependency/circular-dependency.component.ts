import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-circular-dependency',
  templateUrl: './circular-dependency.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CircularDependencyComponent extends BasePageComponent {
  get moduleRef() {
    return `
@Component()
export class CatsService implements OnModuleInit {
  private service: Service;
  constructor(private readonly moduleRef: ModuleRef) {}

  onModuleInit() {
    this.service = this.moduleRef.get<Service>(Service);
  }
}`;
  }

  get moduleRefJs() {
    return `
@Component()
@Dependencies(ModuleRef)
export class CatsService {
  constructor(moduleRef) {
    this.moduleRef = moduleRef;
  }

  onModuleInit() {
    this.service = this.moduleRef.get(Service);
  }
}`;
  }

  get proxy() {
    return `
@Component()
export class Proxy {
  private readonly subject: Subject<any>;

  get stream$(): Observable<any> {
    return this.subject.asObservable();
  }

  publish(event) {
    this.subject.next(event);
  }
}`;
  }

  get forwardRef() {
    return `
@Component()
export class CatsService {
  constructor(
    @Inject(forwardRef(() => CommonService))
    private readonly commonService: CommonService,
  ) {}
}`;
  }

  get forwardRefJs() {
    return `
@Component()
@Dependencies(forwardRef(() => CommonService))
export class CatsService {
  constructor(commonService) {
    this.commonService = commonService;
  }
}`;
  }

  get forwardRefCommon() {
    return `
@Component()
export class CommonService {
  constructor(
    @Inject(forwardRef(() => CatsService))
    private readonly catsService: CatsService,
  ) {}
}`;
  }

  get forwardRefCommonJs() {
    return `
@Component()
@Dependencies(forwardRef(() => CatsService))
export class CommonService {
  constructor(catsService) {
    this.catsService = catsService;
  }
}`;
  }

  get forwardRefModule() {
    return `
@Module({
  imports: [forwardRef(() => CatsModule)],
})
export class CommonModule {}`;
  }
}

