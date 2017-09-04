import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { BasePageComponent } from '../../page/page.component';

@Component({
  selector: 'app-unit-testing',
  templateUrl: './unit-testing.component.html',
  styleUrls: ['./unit-testing.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UnitTestingComponent extends BasePageComponent {
  get isolatedTests() {
    return `
import { CatsController } from './cats.controller';
import { CatsService } from './cats.service';

describe('CatsController', () => {
  let catsController: CatsController;
  let catsService: CatsService;

  beforeEach(() => {
    catsService = new CatsService();
    catsController = new CatsController(catsService);
  });

  describe('findAll', () => {
    it('should return an array of cats', async () => {
      const result = ['test'];
      jest.spyOn(catsService, 'findAll').mockImplementation(() => result);

      expect(await catsController.findAll()).toBe(result);
    });
  });
});`;
  }
}