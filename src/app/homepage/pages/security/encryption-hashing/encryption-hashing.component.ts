import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-encryption-hashing',
  templateUrl: './encryption-hashing.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EncryptionHashingComponent extends BasePageComponent {}
