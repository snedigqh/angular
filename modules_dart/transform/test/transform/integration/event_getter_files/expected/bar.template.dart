library bar.template.dart;

import 'bar.dart';
import 'package:angular2/src/core/reflection/reflection.dart' as _ngRef;
import 'package:angular2/src/core/metadata.dart';
import 'package:angular2/src/core/metadata.template.dart' as i0;
export 'bar.dart';

var _visited = false;
void initReflector() {
  if (_visited) return;
  _visited = true;
  _ngRef.reflector
    ..registerType(
        MyComponent,
        new _ngRef.ReflectionInfo(const [
          const Component(
              outputs: ['eventName1', 'eventName2: propName2'],
              selector: '[soup]'),
          const View(template: ''),
          hostViewFactory_MyComponent
        ], const [], () => new MyComponent()))
    ..registerGetters(
        {'eventName1': (o) => o.eventName1, 'eventName2': (o) => o.eventName2});
  i0.initReflector();
}
