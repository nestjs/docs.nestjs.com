import { HttpParams } from '@angular/common/http';
import { AsyncPipe, Location } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  QueryList,
  ViewChildren,
} from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { BehaviorSubject, catchError, combineLatest, map, Observable, of } from 'rxjs';
import { ApiItem, ApiSection, ApiService } from '../api.service';
import { groupPackages } from '../package-meta';
import { PackageCardComponent } from '../package-card/package-card.component';
import { Option, SelectComponent } from '../select/select.component';

interface SearchCriteria {
  query: string;
  status: string;
  type: string;
}

interface PackageGroup {
  id: string;
  title: string;
  sections: ApiSection[];
}

@Component({
  selector: 'app-api-list',
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [AsyncPipe, PackageCardComponent, SelectComponent],
})
export class ApiListComponent implements OnInit {
  public readonly types: Option[] = [
    { value: 'all', title: 'All' },
    { value: 'class', title: 'Class' },
    { value: 'const', title: 'Const' },
    { value: 'decorator', title: 'Decorator' },
    { value: 'function', title: 'Function' },
    { value: 'interface', title: 'Interface' },
    { value: 'injectable', title: 'Injectable' },
    { value: 'nestmodule', title: 'Module' },
    { value: 'pipe', title: 'Pipe' },
    { value: 'type-alias', title: 'Type alias' },
  ];
  public readonly statuses: Option[] = [
    { value: 'all', title: 'All' },
    { value: 'deprecated', title: 'Deprecated' },
  ];

  public type = this.types[0];
  public status = this.statuses[0];
  public query = '';
  public filterActive = false;
  /** `'missing'` when the reference has not been generated (no `npm run api`). */
  public groups$: Observable<PackageGroup[] | 'missing'>;

  @ViewChildren(PackageCardComponent)
  private readonly cards!: QueryList<PackageCardComponent>;

  private readonly apiService = inject(ApiService);
  private readonly location = inject(Location);
  private readonly route = inject(ActivatedRoute);
  private criteria$: BehaviorSubject<SearchCriteria>;

  public ngOnInit(): void {
    // Filters live in the query string so a filtered overview can be shared.
    const params = this.route.snapshot.queryParamMap;
    this.query = (params.get('query') ?? '').toLowerCase();
    this.type = this.types.find((t) => t.value === params.get('type')) ?? this.types[0];
    this.status =
      this.statuses.find((s) => s.value === params.get('status')) ?? this.statuses[0];
    this.criteria$ = new BehaviorSubject(this.criteria());
    this.filterActive = this.isFilterActive();

    this.groups$ = combineLatest([this.apiService.getApiList(), this.criteria$]).pipe(
      map(([sections, criteria]) =>
        groupPackages(
          sections
            .map((section) => ({ ...section, items: this.filterSection(section, criteria) }))
            .filter((section) => section.items?.length),
        ).map((group) => ({ ...group, id: groupId(group.title) })),
      ),
      catchError(() => of('missing' as const)),
    );
  }

  public setQuery(query: string): void {
    this.query = (query || '').toLowerCase().trim();
    this.update();
  }

  public setType(type: Option): void {
    this.type = type;
    this.update();
  }

  public setStatus(status: Option): void {
    this.status = status;
    this.update();
  }

  public get allOpen(): boolean {
    return !!this.cards?.length && this.cards.toArray().every((c) => c.isOpen);
  }

  public toggleAll(): void {
    const open = !this.allOpen;
    this.cards.forEach((card) => card.setOpen(open));
  }

  private update(): void {
    const criteria = this.criteria();
    this.filterActive = this.isFilterActive();
    this.criteria$.next(criteria);

    // replaceState rather than a router navigation, which would scroll to
    // the top on every keystroke.
    const params = new HttpParams({
      fromObject: {
        ...(criteria.query && { query: criteria.query }),
        ...(criteria.type !== 'all' && { type: criteria.type }),
        ...(criteria.status !== 'all' && { status: criteria.status }),
      },
    });
    this.location.replaceState(this.location.path().split('?')[0], params.toString());
  }

  private criteria(): SearchCriteria {
    return { query: this.query, type: this.type.value, status: this.status.value };
  }

  private isFilterActive(): boolean {
    return !!this.query || this.type.value !== 'all' || this.status.value !== 'all';
  }

  private filterSection(
    section: ApiSection,
    { query, status, type }: SearchCriteria,
  ): ApiItem[] {
    const sectionNameMatches = !query || section.name.includes(query);
    return (section.items ?? []).filter(
      (item) =>
        (type === 'all' || type === item.docType) &&
        (status === 'all' || status === item.stability) &&
        (sectionNameMatches || item.name.includes(query)),
    );
  }
}

function groupId(title: string): string {
  return 'group-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
}
