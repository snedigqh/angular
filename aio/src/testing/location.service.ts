import { BehaviorSubject } from 'rxjs/BehaviorSubject';

export class MockLocationService {
  urlSubject = new BehaviorSubject<string>(this.initialUrl);
  currentUrl = this.urlSubject.asObservable();
  search = jasmine.createSpy('search').and.returnValue({});
  setSearch = jasmine.createSpy('setSearch');
  go = jasmine.createSpy('Location.go').and
              .callFake((url: string) => this.urlSubject.next(url));
  path = jasmine.createSpy('Location.path').and
              .callFake(() => this.urlSubject.getValue().split('?')[0]);
  handleAnchorClick = jasmine.createSpy('Location.handleAnchorClick')
      .and.returnValue(false); // prevent click from causing a browser navigation

  constructor(private initialUrl) {}
}

