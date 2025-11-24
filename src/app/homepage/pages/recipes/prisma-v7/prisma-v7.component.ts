import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-prisma-v7',
  templateUrl: './prisma-v7.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrismaV7Component extends BasePageComponent {}
