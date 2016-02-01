library bar.template.dart;

import 'bar.dart';
import 'package:angular2/src/core/reflection/reflection.dart' as _ngRef;
import 'package:angular2/src/core/metadata.dart';
import 'foo.dart';
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
          const Component(componentServices: const [MyContext]),
          const View(template: ''),
          hostViewFactory_MyComponent
        ], const [
          const [MyContext]
        ], (MyContext c) => new MyComponent(c)));
  i0.initReflector();
}
