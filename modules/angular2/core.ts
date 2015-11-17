/**
 * @module
 * @description
 * Starting point to import all public core APIs.
 */
export * from './src/core/metadata';
export * from './src/core/util';
export * from './src/core/di';
export * from './src/common/pipes';
export * from './src/facade/facade';
export * from './src/core/linker';
export {platform, createNgZone, PlatformRef, ApplicationRef} from './src/core/application_ref';
export {APP_ID, APP_COMPONENT} from './src/core/application_tokens';
export * from './src/core/zone';
export * from './src/core/render';
export * from './src/common/directives';
export * from './src/common/forms';
export {
  DebugElement,
  Scope,
  inspectElement,
  asNativeElements
} from './src/core/debug/debug_element';
export * from './src/core/testability/testability';
export * from './src/core/change_detection';
export * from './src/core/platform_directives_and_pipes';
export * from './src/core/dev_mode';
export * from './src/core/reflection/reflection';
export * from './src/core/application_common_providers';
export * from './src/core/platform_common_providers';
export * from './src/core/dom/dom_adapter';
