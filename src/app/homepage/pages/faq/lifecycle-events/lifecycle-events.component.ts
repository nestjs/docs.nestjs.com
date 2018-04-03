import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-lifecycle-events',
  templateUrl: './lifecycle-events.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecycleEventsComponent extends BasePageComponent {
  get lifecycleEvents() {
    return `
import { Component, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Component()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    console.log(\`Module's initialized...\`);
  }
  onModuleDestroy() {
    console.log(\`Module's destroyed...\`);
  }
}`;
  }

  get lifecycleEventsJs() {
    return `
import { Component } from '@nestjs/common';

@Component()
export class UsersService {
  onModuleInit() {
    console.log(\`Module's initialized...\`);
  }
  onModuleDestroy() {
    console.log(\`Module's destroyed...\`);
  }
}`;
  }
}
