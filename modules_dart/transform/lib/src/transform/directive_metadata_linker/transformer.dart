library angular2.transform.directive_metadata_linker.transformer;

import 'dart:async';
import 'dart:convert';

import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/code/ng_deps_code.dart';
import 'package:angular2/src/transform/common/formatter.dart';
import 'package:angular2/src/transform/common/logging.dart' as log;
import 'package:angular2/src/transform/common/names.dart';
import 'package:barback/barback.dart';

import 'ng_meta_linker.dart';

/// Transformer responsible for processing .ng_meta.json files created by
/// {@link DirectiveProcessor} and "linking" them.
///
/// This step ensures that for libraries that export, all `Directive`s reachable
/// from that library are declared in its associated .ng_meta.json file.
///
/// See `common/ng_meta.dart` for the JSON format of these files are serialized
/// to.
class DirectiveMetadataLinker extends Transformer
    implements DeclaringTransformer {
  final _encoder = const JsonEncoder.withIndent('  ');

  @override
  bool isPrimary(AssetId id) => id.path.endsWith(META_EXTENSION);

  @override
  declareOutputs(DeclaringTransform transform) {
    // TODO(kegluenq): We should consume this, but doing so causes barback to
    // incorrectly determine what assets are available in this phase.
    // transform.consumePrimary();
    transform.declareOutput(transform.primaryId);
    transform.declareOutput(_depsAssetId(transform.primaryId));
  }

  @override
  Future apply(Transform transform) {
    return log.initZoned(transform, () {
      var primaryId = transform.primaryInput.id;

      return linkDirectiveMetadata(
          new AssetReader.fromTransform(transform), primaryId).then((ngMeta) {
        // See above
        // transform.consumePrimary();
        if (ngMeta != null) {
          if (!ngMeta.types.isEmpty || !ngMeta.aliases.isEmpty) {
            transform.addOutput(new Asset.fromString(
                primaryId, _encoder.convert(ngMeta.toJson(withNgDeps: false))));
          } else {
            // Not outputting an asset could confuse barback.
            transform.addOutput(new Asset.fromString(primaryId, ''));
          }

          var depsAssetId = _depsAssetId(primaryId);
          if (!ngMeta.isNgDepsEmpty) {
            var buf = new StringBuffer();
            var writer = new NgDepsWriter(buf);
            writer.writeNgDepsModel(ngMeta.ngDeps);
            var formattedCode =
                formatter.format(buf.toString(), uri: depsAssetId.path);
            transform
                .addOutput(new Asset.fromString(depsAssetId, formattedCode));
          } else {
            transform.addOutput(
                new Asset.fromString(depsAssetId, _emptyNgDepsContents));
          }
        }
      });
    });
  }
}

AssetId _depsAssetId(AssetId primaryId) =>
    new AssetId(primaryId.package, toDepsExtension(primaryId.path));

const _emptyNgDepsContents = 'initReflector() {}';
