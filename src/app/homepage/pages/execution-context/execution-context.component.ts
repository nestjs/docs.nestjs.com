import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../page/page.component';

@Component({
  selector: 'app-execution-context',
  templateUrl: './execution-context.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ExecutionContextComponent extends BasePageComponent {
  get executionContext() {
    return `
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(ApplicationModule);
  // logic.. :)
}
bootstrap();`;
  }

  get pickTasksController() {
    return `
const app = await NestFactory.create(ApplicationModule);
const tasksController = app
  .select(TasksModule)
  .get(TasksController);
`;
  }
}
