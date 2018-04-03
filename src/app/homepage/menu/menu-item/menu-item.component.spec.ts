import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuItemComponent } from './menu-item.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('MenuItemComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        MenuItemComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MenuItemComponent>;
  let component: MenuItemComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MenuItemComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
