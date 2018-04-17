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
import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Injectable()
export class UsersService implements OnModuleInit, OnModuleDestroy {
  onModuleInit() {
    console.log(\`Module is initialized...\`);
  }
  
  onModuleDestroy() {
    console.log(\`Module is destroyed...\`);
  }
}`;
  }

  get lifecycleEventsJs() {
    return `
import { Injectable } from '@nestjs/common';

@Injectable()
export class UsersService {
  onModuleInit() {
    console.log(\`Module is initialized...\`);
  }

  onModuleDestroy() {
    console.log(\`Module is destroyed...\`);
  }
}`;
  }
}
