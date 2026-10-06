import { ChangeDetectionStrategy, Component, inject, Input, OnChanges } from '@angular/core';
import { RouterLink } from '@angular/router';
import { StorageService } from '../../../services/storage.service';
import { ApiItem, ApiService } from '../api.service';
import { packageHue, packageIcon, packageId } from '../package-meta';

export type PackageCardContext = 'overview' | 'detail';

@Component({
  selector: 'app-package-card',
  templateUrl: './package-card.component.html',
  styleUrls: ['./package-card.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [RouterLink],
  host: {
    class: 'package-card',
    '[id]': 'id',
    '[style.--pkg-hue]': 'hue',
  },
})
export class PackageCardComponent implements OnChanges {
  @Input({ required: true }) name = '';
  @Input() path = '';
  @Input() items: ApiItem[] | null = null;
  @Input() deprecated = false;
  @Input() context: PackageCardContext = 'overview';
  /** Keeps the card expanded regardless of its stored state (used while a filter is active). */
  @Input() forceOpen = false;

  public open = true;

  private readonly storage = inject(StorageService);
  private readonly api = inject(ApiService);

  public get isOpen(): boolean {
    return this.open || this.forceOpen;
  }

  public prefetch(path: string): void {
    this.api.prefetchDocument(path);
  }

  public get id(): string {
    return packageId(this.name);
  }

  public get hue(): number {
    return packageHue(this.name);
  }

  public get icon(): string {
    return packageIcon(this.name);
  }

  public ngOnChanges(): void {
    if (this.context === 'detail') {
      this.open = false;
      return;
    }
    const stored = this.readStored();
    this.open = typeof stored === 'boolean' ? stored : true;
  }

  // Used by the overview's expand/collapse-all control.
  public setOpen(open: boolean): void {
    if (open === this.open) {
      return;
    }
    this.open = open;
    this.store();
  }

  public onToggle(details: HTMLDetailsElement): void {
    if (details.open === this.open) {
      return;
    }
    this.open = details.open;
    this.store();
  }

  // Storage can be unavailable (private mode, blocked site data); the card
  // then simply forgets its state.
  private readStored(): unknown {
    try {
      return this.storage.get(this.storageKey);
    } catch {
      return null;
    }
  }

  private store(): void {
    if (this.context !== 'overview') {
      return;
    }
    try {
      this.storage.set(this.storageKey, this.open);
    } catch {
      // see readStored
    }
  }

  private get storageKey(): string {
    return `package-card:overview:${this.name}`;
  }
}
