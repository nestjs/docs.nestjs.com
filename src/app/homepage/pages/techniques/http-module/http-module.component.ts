import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-http-module',
  templateUrl: './http-module.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HttpModuleComponent extends BasePageComponent {
  get httpModule() {
    return `
@Module({
  imports: [HttpModule],
  providers: [CatsService],
})
export class CatsModule {}`;
  }

  get httpService() {
    return `
@Injectable()
export class CatsService {
  constructor(private readonly httpService: HttpService) {} 
  
  findAll(): Observable<AxiosResponse<Cat[]>> {
    return this.httpService.get('http://localhost:3000/cats');
  }
}`;
  }

  get httpServiceJs() {
    return `
@Injectable()
@Dependencies(HttpService)
export class CatsService {
  constructor(httpService) {
    this.httpService = httpService;
  } 
  
  findAll() {
    return this.httpService.get('http://localhost:3000/cats');
  }
}`;
  }
}
