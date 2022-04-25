import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { HomepageComponent } from './homepage.component';
import { FooterComponent } from './footer/footer.component';
import { HeaderComponent } from './header/header.component';
import { RouterTestingModule } from '@angular/router/testing';
import { MenuComponent } from './menu/menu.component';
import { MenuItemComponent } from './menu/menu-item/menu-item.component';
import { SocialWrapperComponent } from '../common/social-wrapper/social-wrapper.component';
import { TocComponent } from '../shared/components/toc/toc.component';
import { NewsletterComponent } from './newsletter/newsletter.component';
import { HttpClient, HttpHandler } from '@angular/common/http';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

describe('HomepageComponent', () => {
  beforeEach(waitForAsync(() => {
    return TestBed.configureTestingModule({
      imports: [RouterTestingModule, BrowserAnimationsModule],
      declarations: [
        FooterComponent,
        HeaderComponent,
        SocialWrapperComponent,
        MenuComponent,
        MenuItemComponent,
        TocComponent,
        NewsletterComponent,
        HomepageComponent,
      ],
      providers: [HttpClient, HttpHandler],
    }).compileComponents();
  }));

  let fixture: ComponentFixture<HomepageComponent>;
  let component: HomepageComponent;
  beforeEach(() => {
    fixture = TestBed.createComponent(HomepageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
