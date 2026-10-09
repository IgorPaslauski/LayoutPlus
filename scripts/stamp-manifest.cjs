const fs = require('node:fs');
const path = require('node:path');

const SEMVER = /^\d+\.\d+\.\d+$/;

function readPackageVersion(root) {
  const pkg = JSON.parse(fs.readFileSync(path.join(root, 'package.json'), 'utf8'));
  if (typeof pkg.version !== 'string' || !SEMVER.test(pkg.version)) {
    throw new Error(`package.json version must be x.y.z, got ${pkg.version}`);
  }
  return pkg.version;
}

function stampManifest(root) {
  const version = readPackageVersion(root);
  const manifestPath = path.join(root, 'dist', 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  manifest.version = version;
  fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
}

module.exports = {stampManifest, readPackageVersion};
