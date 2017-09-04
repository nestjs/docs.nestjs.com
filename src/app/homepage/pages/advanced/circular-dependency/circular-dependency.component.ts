import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-circular-dependency',
  templateUrl: './circular-dependency.component.html',
  styleUrls: ['./circular-dependency.component.scss'],
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
}

