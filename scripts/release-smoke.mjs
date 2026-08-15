import { readFileSync } from 'node:fs';

const packageJson = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8'));
const build = packageJson.build;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function hasTarget(platform, target) {
  const configured = build[platform]?.target;
  return Array.isArray(configured) && configured.includes(target);
}

assert(typeof packageJson.version === 'string' && /^\d+\.\d+\.\d+/.test(packageJson.version), 'package.json must have a semantic version.');
assert(build.appId === 'com.luckycharm.desktop', 'Release appId must remain stable for updates.');
assert(build.directories?.output === 'release', 'Release artifacts must be written to release/.');
assert(typeof build.artifactName === 'string' && build.artifactName.includes('${version}'), 'Artifact names must include the release version.');
assert(hasTarget('mac', 'dmg') && hasTarget('mac', 'zip'), 'macOS releases require DMG and ZIP targets.');
assert(hasTarget('win', 'nsis'), 'Windows releases require an NSIS target.');
assert(hasTarget('linux', 'AppImage'), 'Linux releases require an AppImage target.');

console.log(`Release configuration is valid for Lucky Charm ${packageJson.version}.`);
