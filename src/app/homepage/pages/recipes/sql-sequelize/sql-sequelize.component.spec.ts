import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlSequelizeComponent } from './sql-sequelize.component';

describe('SqlSequelizeComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [ SqlSequelizeComponent ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SqlSequelizeComponent>;
  let component: SqlSequelizeComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SqlSequelizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
