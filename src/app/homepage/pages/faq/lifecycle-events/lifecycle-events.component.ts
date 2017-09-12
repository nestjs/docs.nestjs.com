import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-lifecycle-events',
  templateUrl: './lifecycle-events.component.html',
  styleUrls: ['./lifecycle-events.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class LifecycleEventsComponent extends BasePageComponent {
  get lifecycleEvents() {
    return `
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

@Component()
export class UsersService implements OnModuleInit, OnModuleDestroy {
    onModuleInit() {
        console.log('Module's initialized...');
    }
    onModuleDestroy() {
       console.log('Module's destroyed...');
    }
}`;
  }
}
