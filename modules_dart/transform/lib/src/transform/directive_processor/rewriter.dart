library angular2.transform.directive_processor.rewriter;

import 'dart:async';

import 'package:analyzer/analyzer.dart';
import 'package:angular2/src/transform/common/annotation_matcher.dart';
import 'package:angular2/src/transform/common/asset_reader.dart';
import 'package:angular2/src/transform/common/async_string_writer.dart';
import 'package:angular2/src/transform/common/code/ng_deps_code.dart';
import 'package:angular2/src/transform/common/logging.dart';
import 'package:angular2/src/transform/common/xhr_impl.dart';
import 'package:angular2/src/transform/common/ng_meta.dart';
import 'package:barback/barback.dart' show AssetId;
import 'package:code_transformers/assets.dart';
import 'package:path/path.dart' as path;
import 'package:source_span/source_span.dart';

import 'inliner.dart';

/// Generates a file registering all Angular 2 `Directive`s found in `code` in
/// ngDeps format [TODO(kegluneq): documentation reference needed]. `assetId` is
/// the id of the asset containing `code`.
///
/// If no Angular 2 `Directive`s are found in `code`, returns the empty
/// string unless `forceGenerate` is true, in which case an empty ngDeps
/// file is created.
Future<String> createNgDeps(AssetReader reader, AssetId assetId,
    AnnotationMatcher annotationMatcher, NgMeta ngMeta,
    {bool inlineViews}) async {
  // TODO(kegluneq): Shortcut if we can determine that there are no
  // [Directive]s present, taking into account `export`s.
  var code = await reader.readAsString(assetId);

  var directivesVisitor = new _NgDepsDirectivesVisitor();
  parseDirectives(code, name: assetId.path)
      .directives
      .accept(directivesVisitor);

  // If this is part of another library, its contents will be processed by its
  // parent, so it does not need its own `.ng_deps.dart` file.
  if (directivesVisitor.isPart) return null;

  var codeWithParts =
      await _getAllDeclarations(reader, assetId, code, directivesVisitor);
  var parsedCode =
      parseCompilationUnit(codeWithParts, name: '${assetId.path} and parts');

  var ngDepsVisitor = new NgDepsVisitor(assetId, annotationMatcher);
  // TODO(kegluneq): Parse `declarations` in the NgDepsModel as well.
  parsedCode.accept(ngDepsVisitor);
  var ngDepsModel = ngDepsVisitor.model;

  // If this file imports only dart: libraries and does not define any
  // reflectables of its own, it doesn't need a .ng_deps.dart file.
  if (!directivesVisitor.usesNonLangLibs &&
      (ngDepsModel.reflectables == null || ngDepsModel.reflectables.isEmpty)) {
    return null;
  }

  var ngMetaVisitor = new _NgMetaVisitor(ngMeta);
  parsedCode.accept(ngMetaVisitor);

  if (inlineViews) {
    await inlineViewProps(new XhrImpl(reader, assetId), ngDepsModel);
  }

  var buffer = new StringBuffer();
  var ngDepsWriter = new NgDepsWriter(buffer);
  ngDepsWriter.writeNgDepsModel(ngDepsModel);
  return '$buffer';
}

/// Processes `visitor.parts`, reading and appending their contents to the
/// original `code`.
/// Order of `part`s is preserved. That is, if in the main library we have
/// ```
/// library main;
///
/// part 'lib1.dart'
/// part 'lib2.dart'
/// ```
/// The output will first have the contents of lib1 followed by the contents of
/// lib2.dart, followed by the original code in the library.
Future<String> _getAllDeclarations(AssetReader reader, AssetId assetId,
    String code, _NgDepsDirectivesVisitor visitor) {
  if (visitor.parts.isEmpty) return new Future<String>.value(code);

  var partsStart = visitor.parts.first.offset,
      partsEnd = visitor.parts.last.end;

  var asyncWriter = new AsyncStringWriter(code.substring(0, partsStart));
  visitor.parts.forEach((partDirective) {
    var uri = stringLiteralToString(partDirective.uri);
    var partAssetId = uriToAssetId(assetId, uri, logger, null /* span */,
        errorOnAbsolute: false);
    asyncWriter.asyncPrint(reader.readAsString(partAssetId).then((partCode) {
      if (partCode == null || partCode.isEmpty) {
        logger.warning('Empty part at "${partDirective.uri}. Ignoring.',
            asset: partAssetId);
        return '';
      }
      // Remove any directives -- we just want declarations.
      var parsedDirectives = parseDirectives(partCode, name: uri).directives;
      return partCode.substring(parsedDirectives.last.end);
    }).catchError((err, stackTrace) {
      logger.warning(
          'Failed while reading part at ${partDirective.uri}. Ignoring.\n'
          'Error: $err\n'
          'Stack Trace: $stackTrace',
          asset: partAssetId,
          span: new SourceFile(code, url: path.basename(assetId.path))
              .span(partDirective.offset, partDirective.end));
    }));
  });
  asyncWriter.print(code.substring(partsEnd));

  return asyncWriter.asyncToString();
}

/// Visitor responsible for flattening directives passed to it.
/// Once this has visited an Ast, use [#writeTo] to write out the directives
/// for the .ng_deps.dart file. See [#writeTo] for details.
class _NgDepsDirectivesVisitor extends Object with SimpleAstVisitor<Object> {
  /// Whether this library `imports` or `exports` any non-'dart:' libraries.
  bool _usesNonLangLibs = false;

  /// Whether the file we are processing is a part, that is, whether we have
  /// visited a `part of` directive.
  bool _isPart = false;

  final List<PartDirective> _parts = <PartDirective>[];

  bool get usesNonLangLibs => _usesNonLangLibs;
  bool get isPart => _isPart;

  /// In the order encountered in the source.
  Iterable<PartDirective> get parts => _parts;

  Object _updateUsesNonLangLibs(UriBasedDirective directive) {
    _usesNonLangLibs = _usesNonLangLibs ||
        !stringLiteralToString(directive.uri).startsWith('dart:');
    return null;
  }

  @override
  Object visitExportDirective(ExportDirective node) =>
      _updateUsesNonLangLibs(node);

  @override
  Object visitImportDirective(ImportDirective node) =>
      _updateUsesNonLangLibs(node);

  @override
  Object visitPartDirective(PartDirective node) {
    _parts.add(node);
    return null;
  }
}

/// Visitor responsible for visiting a file's [Declaration]s and outputting the
/// code necessary to register the file with the Angular 2 system.
class _NgMetaVisitor extends Object with SimpleAstVisitor<Object> {
  /// Output ngMeta information about aliases.
  // TODO(sigmund): add more to ngMeta. Currently this only contains aliasing
  // information, but we could produce here all the metadata we need and avoid
  // parsing the ngdeps files later.
  final NgMeta ngMeta;

  _NgMetaVisitor(this.ngMeta);

  @override
  Object visitCompilationUnit(CompilationUnit node) {
    if (node == null || node.declarations == null) return null;
    return node.declarations.accept(this);
  }

  @override
  Object visitTopLevelVariableDeclaration(TopLevelVariableDeclaration node) {
    // We process any top-level declaration that fits the directive-alias
    // declaration pattern. Ideally we would use an annotation on the field to
    // help us filter out only what's needed, but unfortunately TypeScript
    // doesn't support decorators on variable declarations (see
    // angular/angular#1747 and angular/ts2dart#249 for context).
    outer: for (var variable in node.variables.variables) {
      var initializer = variable.initializer;
      if (initializer != null && initializer is ListLiteral) {
        var otherNames = [];
        for (var exp in initializer.elements) {
          // Only simple identifiers are supported for now.
          // TODO(sigmund): add support for prefixes (see issue #3232).
          if (exp is! SimpleIdentifier) continue outer;
          otherNames.add(exp.name);
        }
        ngMeta.aliases[variable.name.name] = otherNames;
      }
    }
    return null;
  }
}
