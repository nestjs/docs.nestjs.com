import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-e2e-testing',
  templateUrl: './e2e-testing.component.html',
  styleUrls: ['./e2e-testing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class E2eTestingComponent extends BasePageComponent {
  get e2eTests() {
    return `
import * as express from 'express';
import * as request from 'supertest';
import { Test } from '@nestjs/testing';
import { CatsModule } from '../../src/cats/cats.module';
import { CatsService } from '../../src/cats/cats.service';

describe('Cats', () => {
    const server = express();
    const catsService = { findAll: () => ['test'] };

    beforeAll(async () => {
        const module = await Test.createTestingModule({
            imports: [CatsModule],
          })
          .overrideComponent(CatsService).useValue(catsService)
          .compile();

        const app = module.createNestApplication(server);
        await app.init();
    });

    it(\`/GET cats\`, () => {
        return request(server)
            .get('/cats')
            .expect(200)
            .expect({
              data: catsService.findAll(),
            });
    });
});`;
  }
  
}
