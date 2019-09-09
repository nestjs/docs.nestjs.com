import {
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  Component,
} from '@angular/core';
import { NewsletterService } from './services/newsletter.service';

@Component({
  selector: 'app-newsletter',
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterComponent {
  isDisabled: boolean;
  isEmailAdded: boolean;

  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly cd: ChangeDetectorRef,
  ) {}

  async addToNewsletter(event: Event, value: string) {
    event.preventDefault();
    this.isDisabled = true;
    this.cd.markForCheck();

    await this.newsletterService.addToNewsletter(value);
    this.isEmailAdded = true;
    this.cd.markForCheck();
  }
}
