import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlSequelizeComponent } from './sql-sequelize.component';

describe('SqlSequelizeComponent', () => {
  let component: SqlSequelizeComponent;
  let fixture: ComponentFixture<SqlSequelizeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SqlSequelizeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SqlSequelizeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
