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
  standalone: true,
})
export class NewsletterComponent {
  public isDisabled: boolean;
  public isEmailAdded: boolean;

  constructor(
    private readonly newsletterService: NewsletterService,
    private readonly cd: ChangeDetectorRef,
  ) {}

  public async addToNewsletter(event: Event, value: string): Promise<void> {
    event.preventDefault();
    this.isDisabled = true;
    this.cd.markForCheck();

    await this.newsletterService.addToNewsletter(value);
    this.isEmailAdded = true;
    this.cd.markForCheck();
  }
}
