/**
 * @license
 * Copyright Google Inc. All Rights Reserved.
 *
 * Use of this source code is governed by an MIT-style license that can be
 * found in the LICENSE file at https://angular.io/license
 */
/// <reference types="node" />

import * as cluster from 'cluster';

import {CachedFileSystem, NodeJSFileSystem, setFileSystem} from '../../../../src/ngtsc/file_system';
import {parseCommandLineOptions} from '../../command_line_options';
import {ConsoleLogger} from '../../logging/console_logger';
import {Logger, LogLevel} from '../../logging/logger';
import {getSharedSetup} from '../../ngcc_options';
import {CreateCompileFn} from '../api';
import {getCreateCompileFn} from '../create_compile_function';
import {stringifyTask} from '../tasks/utils';

import {MessageToWorker} from './api';
import {ClusterWorkerPackageJsonUpdater} from './package_json_updater';
import {sendMessageToMaster} from './utils';

// Cluster worker entry point
if (require.main === module) {
  (async () => {
    process.title = 'ngcc (worker)';

    try {
      setFileSystem(new CachedFileSystem(new NodeJSFileSystem()));

      const {
        createNewEntryPointFormats = false,
        logger = new ConsoleLogger(LogLevel.info),
        pathMappings,
        errorOnFailedEntryPoint = false,
        enableI18nLegacyMessageIdFormat = true,
        fileSystem,
        tsConfig
      } = getSharedSetup(parseCommandLineOptions(process.argv.slice(2)));

      // NOTE: To avoid file corruption, `ngcc` invocation only creates _one_ instance of
      // `PackageJsonUpdater` that actually writes to disk (across all processes).
      // In cluster workers we use a `PackageJsonUpdater` that delegates to the cluster master.
      const pkgJsonUpdater = new ClusterWorkerPackageJsonUpdater();

      // The function for creating the `compile()` function.
      const createCompileFn = getCreateCompileFn(
          fileSystem, logger, pkgJsonUpdater, createNewEntryPointFormats, errorOnFailedEntryPoint,
          enableI18nLegacyMessageIdFormat, tsConfig, pathMappings);

      await startWorker(logger, createCompileFn);
      process.exitCode = 0;
    } catch (e) {
      console.error(e.stack || e.message);
      process.exit(1);
    }
  })();
}

export async function startWorker(logger: Logger, createCompileFn: CreateCompileFn): Promise<void> {
  if (cluster.isMaster) {
    throw new Error('Tried to run cluster worker on the master process.');
  }

  const compile = createCompileFn(
      (_task, outcome, message) => sendMessageToMaster({type: 'task-completed', outcome, message}));


  // Listen for `ProcessTaskMessage`s and process tasks.
  cluster.worker.on('message', (msg: MessageToWorker) => {
    try {
      switch (msg.type) {
        case 'process-task':
          logger.debug(
              `[Worker #${cluster.worker.id}] Processing task: ${stringifyTask(msg.task)}`);
          return compile(msg.task);
        default:
          throw new Error(
              `[Worker #${cluster.worker.id}] Invalid message received: ${JSON.stringify(msg)}`);
      }
    } catch (err) {
      sendMessageToMaster({
        type: 'error',
        error: (err instanceof Error) ? (err.stack || err.message) : err,
      });
    }
  });

  // Return a promise that is never resolved.
  return new Promise(() => undefined);
}