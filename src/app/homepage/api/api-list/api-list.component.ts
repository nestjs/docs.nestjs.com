import { Component, OnInit } from '@angular/core';
import { Observable, combineLatest, ReplaySubject } from 'rxjs';
import { ApiSection, ApiService } from '../api.service';
import { filter, map } from 'rxjs/operators';

class SearchCriteria {
  query? = '';
}

@Component({
  selector: 'app-api-list',
  templateUrl: './api-list.component.html',
  styleUrls: ['./api-list.component.scss']
})
export class ApiListComponent implements OnInit {
  private criteriaSubject = new ReplaySubject<SearchCriteria>(1);
  private searchCriteria = new SearchCriteria();

  apiSection: Observable<ApiSection[]>;
  nameFilter: string;
  filteredSections: Observable<ApiSection[]>;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.filteredSections = combineLatest(
      this.api.getApiList(),
      this.criteriaSubject,
      (sections, criteria) => {
        return sections.map(section => ({
          ...section,
          items: this.filterSection(section, criteria)
        }));
      }
    );
    this.criteriaSubject.next(this.searchCriteria);
  }

  private filterSection(section: ApiSection, { query }: SearchCriteria) {
    if (!section.items) {
      return [];
    }

    const items = section.items.filter(item => {
      return matchesQuery();

      function matchesQuery() {
        return (
          !query ||
          section.name.indexOf(query) !== -1 ||
          item.name.indexOf(query) !== -1
        );
      }
    });

    // If there are no items we still return an empty array if the section name matches and the type is 'package'
    return items.length
      ? items
      : (!query || section.name.indexOf(query) !== -1)
      ? []
      : null;
  }

  setQuery(query: string) {
    this.setSearchCriteria({query: (query || '').toLowerCase().trim() });
  }

  private setSearchCriteria(criteria: SearchCriteria) {
    this.criteriaSubject.next(Object.assign(this.searchCriteria, criteria));
  }
}
