import { Component, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-angular',
  templateUrl: './angular.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AngularComponent extends BasePageComponent {

  get notFoundExceptionFilter() {
    return `
    import * as path from 'path';
    import { ExceptionFilter, Catch, NotFoundException, ArgumentsHost } from '@nestjs/common';

    @Catch(NotFoundException)
    export class NotFoundExceptionFilter implements ExceptionFilter {

      catch(exception: NotFoundException, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse();
        // path to angular dist/index.html
        response.sendFile(path.join(__dirname, '../dist/index.html'));
      }
    }`;
  }

  get mainTs() {
    return `
    async function bootstrap() {
      const app = await NestFactory.create(ApplicationModule);
      app.useGlobalFilters(new NotFoundExceptionFilter());
      await app.listen(3000);
    }
    bootstrap();`;
  }

}
