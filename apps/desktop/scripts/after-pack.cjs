// Ad-hoc codesigns the .app produced by electron-builder so macOS doesn't
// reject it as "damaged" on Apple Silicon. Runs after each platform pack
// but before any .dmg / .zip is built around the .app, so the signature
// lives inside the distributed image.
const { execSync } = require('node:child_process');
const path = require('node:path');
const fs = require('node:fs');

exports.default = async function afterPack(context) {
  const platform = context.electronPlatformName;
  if (platform !== 'darwin') return;
  const appOutDir = context.appOutDir;
  const productName = context.packager.appInfo.productFilename;
  const appPath = path.join(appOutDir, `${productName}.app`);
  if (!fs.existsSync(appPath)) {
    console.warn(`afterPack: ${appPath} not found, skipping ad-hoc sign`);
    return;
  }
  console.log(`afterPack: ad-hoc codesigning ${appPath}`);
  try {
    execSync(`codesign --force --deep --sign - "${appPath}"`, { stdio: 'inherit' });
    execSync(`codesign --verify --deep --strict --verbose=2 "${appPath}"`, { stdio: 'inherit' });
    console.log('afterPack: ad-hoc signature verified');
  } catch (e) {
    console.error('afterPack: codesign failed', e.message);
    throw e;
  }
};
