const { exec } = require('node:child_process');
// if on mac or linux, run the preinstall script
if (process.platform !== 'win32') {
  exec('pnpm remove mica-electron')
} else {
    exec('pnpm electron-rebuild')
}
