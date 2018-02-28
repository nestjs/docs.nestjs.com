import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-cli',
  templateUrl: './cli.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CliComponent {}
