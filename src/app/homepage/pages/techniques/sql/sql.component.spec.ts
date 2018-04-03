import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SqlComponent } from './sql.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { ExtensionPipe } from '../../../../shared/pipes/extension.pipe';

describe('SqlComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      declarations: [
        TabsComponent,
        ExtensionPipe,
        SqlComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<SqlComponent>;
  let component: SqlComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(SqlComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
