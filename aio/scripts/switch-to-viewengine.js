#!/usr/bin/env node

// Imports
const {extend, parse} = require('cjson');
const {readFileSync, writeFileSync} = require('fs');
const {join, resolve} = require('path');

// Constants
const ROOT_DIR = resolve(__dirname, '..');
const NG_JSON = join(ROOT_DIR, 'angular.json');
const NG_COMPILER_OPTS = {
  angularCompilerOptions: {
    enableIvy: false,
  },
};

// Run
_main(process.argv.slice(2));

// Functions - Definitions
function _main() {
  // Detect path to `tsconfig.app.json`.
  const ngConfig = parse(readFileSync(NG_JSON, 'utf8'));
  const tsConfigPath = join(ROOT_DIR, ngConfig.projects.site.architect.build.options.tsConfig);

  // Enable ViewIngine/Disable Ivy in TS config.
  console.log(`\nModifying \`${tsConfigPath}\`...`);
  const oldTsConfigStr = readFileSync(tsConfigPath, 'utf8');
  const oldTsConfigObj = parse(oldTsConfigStr);
  const newTsConfigObj = extend(true, oldTsConfigObj, NG_COMPILER_OPTS);
  const newTsConfigStr = `${JSON.stringify(newTsConfigObj, null, 2)}\n`;
  console.log(`\nNew config: ${newTsConfigStr}`);
  writeFileSync(tsConfigPath, newTsConfigStr);

  // Done.
  console.log('\nReady to build with ViewEngine!');
  console.log('(To switch back to Ivy (with packages from npm), undo the changes in ' +
              `\`${tsConfigPath}\` and run \`yarn aio-use-npm && yarn example-use-npm\`.)`);
}
