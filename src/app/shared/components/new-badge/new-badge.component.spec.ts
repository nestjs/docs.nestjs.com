import { TestBed } from '@angular/core/testing';
import { NewBadgeComponent } from './new-badge.component';

describe('NewBadgeComponent', () => {
  it('should render the label with decorative layers hidden from assistive tech', async () => {
    await TestBed.configureTestingModule({
      imports: [NewBadgeComponent],
    }).compileComponents();

    const fixture = TestBed.createComponent(NewBadgeComponent);
    fixture.detectChanges();
    const host: HTMLElement = fixture.nativeElement;

    expect(host.textContent.trim()).toBe('NEW');
    expect(host.querySelectorAll('[aria-hidden="true"]').length).toBe(2);
  });
});
