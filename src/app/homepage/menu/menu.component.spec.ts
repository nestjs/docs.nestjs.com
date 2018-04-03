import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuComponent } from './menu.component';
import { MenuItemComponent } from './menu-item/menu-item.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('MenuComponent', () => {
  beforeEach(async(() => {
    return TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      declarations: [
        MenuComponent,
        MenuItemComponent
      ]
    })
    .compileComponents();
  }));

  let fixture: ComponentFixture<MenuComponent>;
  let component: MenuComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(MenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  xit('should be created', () => {
    expect(component).toBeTruthy();
  });
});
