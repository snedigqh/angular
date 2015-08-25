import {bootstrap, Component, View, ViewEncapsulation} from 'angular2/bootstrap';
import {MdGridList, MdGridTile} from 'angular2_material/src/components/grid_list/grid_list';
import {UrlResolver} from 'angular2/src/core/services/url_resolver';
import {commonDemoSetup, DemoUrlResolver} from '../demo_common';
import {bind} from 'angular2/di';

@Component({
  selector: 'demo-app',
})
@View({
  templateUrl: './demo_app.html',
  directives: [MdGridList, MdGridTile],
  encapsulation: ViewEncapsulation.NONE,
})
class DemoApp {
  tile3RowSpan: number;
  tile3ColSpan: number;

  constructor() {
    this.tile3RowSpan = 3;
    this.tile3ColSpan = 3;
  }
}

export function main() {
  commonDemoSetup();
  bootstrap(DemoApp, [bind(UrlResolver).toValue(new DemoUrlResolver())]);
}
