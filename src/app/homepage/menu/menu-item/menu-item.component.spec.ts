import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { MenuItemComponent } from './menu-item.component';
import { RouterTestingModule } from '@angular/router/testing';

describe('MenuItemComponent', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [
        BrowserAnimationsModule,
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
