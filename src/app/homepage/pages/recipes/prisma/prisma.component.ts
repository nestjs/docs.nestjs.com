import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-prisma',
  templateUrl: './prisma.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrismaComponent extends BasePageComponent {}
