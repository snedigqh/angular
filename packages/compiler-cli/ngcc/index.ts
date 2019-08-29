/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
import {CachedFileSystem, NodeJSFileSystem, setFileSystem} from '../src/ngtsc/file_system';

import {mainNgcc} from './src/main';
export {ConsoleLogger, LogLevel} from './src/logging/console_logger';
export {Logger} from './src/logging/logger';
export {NgccOptions} from './src/main';
export {PathMappings} from './src/utils';

export function process(...args: Parameters<typeof mainNgcc>) {
  // Recreate the file system on each call to reset the cache
  setFileSystem(new CachedFileSystem(new NodeJSFileSystem()));
  return mainNgcc(...args);
}
