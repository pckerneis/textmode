// Builds a self-contained executable using Node's Single Executable
// Application (SEA) feature: bundle the CLI into one file with esbuild,
// generate a SEA blob, then inject it into a copy of the current Node
// binary. Produces dist/textmode (or dist/textmode.exe on Windows).

var fs = require('fs');
var path = require('path');
var os = require('os');
var execFileSync = require('child_process').execFileSync;
var esbuild = require('esbuild');

var ROOT = path.join(__dirname, '..');
var DIST = path.join(ROOT, 'dist');
var BUNDLE_PATH = path.join(DIST, 'bundle.js');
var SEA_CONFIG_PATH = path.join(DIST, 'sea-config.json');
var BLOB_PATH = path.join(DIST, 'sea-prep.blob');
var EXE_NAME = process.platform === 'win32' ? 'textmode.exe' : 'textmode';
var EXE_PATH = path.join(DIST, EXE_NAME);
var SEA_FUSE = 'NODE_SEA_FUSE_fce680ab2cc467b6e072b8b5df1996b2';

function run(cmd, args, opts) {
  console.log('$ ' + cmd + ' ' + args.join(' '));
  execFileSync(cmd, args, Object.assign({ stdio: 'inherit' }, opts));
}

function main() {
  fs.rmSync(DIST, { recursive: true, force: true });
  fs.mkdirSync(DIST, { recursive: true });

  console.log('Bundling CLI into a single file...');
  esbuild.buildSync({
    entryPoints: [path.join(ROOT, 'bin', 'textmode.js')],
    bundle: true,
    platform: 'node',
    format: 'cjs',
    outfile: BUNDLE_PATH
  });

  fs.writeFileSync(
    SEA_CONFIG_PATH,
    JSON.stringify(
      {
        main: 'bundle.js',
        output: 'sea-prep.blob',
        disableExperimentalSEAWarning: true
      },
      null,
      2
    )
  );

  console.log('Generating SEA blob...');
  run(process.execPath, ['--experimental-sea-config', 'sea-config.json'], { cwd: DIST });

  console.log('Copying node binary...');
  fs.copyFileSync(process.execPath, EXE_PATH);
  fs.chmodSync(EXE_PATH, 0o755);

  if (process.platform === 'darwin') {
    var lipoInfo = execFileSync('lipo', ['-info', EXE_PATH]).toString();

    if (lipoInfo.indexOf('Non-fat') === -1) {
      console.log('Thinning universal binary to ' + os.arch() + '...');
      var thinArch = os.arch() === 'arm64' ? 'arm64' : 'x86_64';
      run('lipo', [EXE_PATH, '-thin', thinArch, '-output', EXE_PATH]);
    }

    console.log('Removing existing code signature...');
    run('codesign', ['--remove-signature', EXE_PATH]);
  } else if (process.platform === 'win32') {
    // no signature removal step needed on Windows
  } else {
    try {
      run('objcopy', ['--remove-section', '.note.gnu.build-id', EXE_PATH]);
    } catch (e) {
      // optional on Linux, ignore if objcopy is unavailable
    }
  }

  console.log('Injecting SEA blob into executable...');
  var postjectBin = path.join(ROOT, 'node_modules', '.bin', process.platform === 'win32' ? 'postject.cmd' : 'postject');
  var injectArgs = [EXE_PATH, 'NODE_SEA_BLOB', BLOB_PATH, '--sentinel-fuse', SEA_FUSE];

  if (process.platform === 'darwin') {
    injectArgs.push('--macho-segment-name', 'NODE_SEA');
  }

  run(postjectBin, injectArgs);

  if (process.platform === 'darwin') {
    console.log('Re-signing executable (ad-hoc)...');
    run('codesign', ['--sign', '-', EXE_PATH]);
  }

  console.log('\nBuilt ' + path.relative(ROOT, EXE_PATH));
}

main();
