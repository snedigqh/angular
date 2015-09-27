import {Component, View, NgFor} from 'angular2/angular2';
import {Jsonp, Response} from 'angular2/http';
import {ObservableWrapper} from 'angular2/src/core/facade/async';

@Component({selector: 'jsonp-app'})
@View({
  directives: [NgFor],
  template: `
    <h1>people</h1>
    <ul class="people">
      <li *ng-for="#person of people">
        hello, {{person['name']}}
      </li>
    </ul>
  `
})
export class JsonpCmp {
  people: Object;
  constructor(jsonp: Jsonp) {
    jsonp.get('./people.json?callback=JSONP_CALLBACK').subscribe(res => this.people = res.json());
  }
}
