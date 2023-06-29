
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-streaming-files',
  templateUrl: './streaming-files.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class StreamingFilesComponent extends BasePageComponent {}
