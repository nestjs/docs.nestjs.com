import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
  inject,
} from '@angular/core';
import { NewsletterService } from './services/newsletter.service';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
})
export class NewsletterComponent {
  private readonly newsletterService = inject(NewsletterService);
  private readonly cd = inject(ChangeDetectorRef);

  public isDisabled: boolean;
  public isEmailAdded: boolean;

  public async addToNewsletter(event: Event, value: string): Promise<void> {
    event.preventDefault();
    this.isDisabled = true;
    this.cd.markForCheck();

    await this.newsletterService.addToNewsletter(value);
    this.isEmailAdded = true;
    this.cd.markForCheck();
  }
}
