// Loads a shader file and runs it inside a restricted vm context, so a
// shader can only see a small, safe set of globals (Math, Date, console,
// module/exports) and nothing from the host process (fs, require, etc).

var vm = require('vm');
var fs = require('fs');
var path = require('path');

function makeSandboxConsole() {
  function write() {
    var args = Array.prototype.slice.call(arguments);
    process.stderr.write(args.join(' ') + '\n');
  }

  return {
    log: write,
    error: write,
    warn: write
  };
}

function loadShader(filePath) {
  var code = fs.readFileSync(filePath, 'utf8');
  var exportsObj = {};
  var fakeModule = { exports: exportsObj };
  var sandbox, context, script, result;

  sandbox = {
    module: fakeModule,
    exports: exportsObj,
    console: makeSandboxConsole(),
    Math: Math,
    Date: Date,
    parseInt: parseInt,
    parseFloat: parseFloat,
    isNaN: isNaN,
    __filename: filePath,
    __dirname: path.dirname(filePath),
    // Per-frame/per-cell state, updated by the renderer before each call
    // into the shader so shader code can read them as plain globals.
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    time: 0,
    frame: 0
  };

  context = vm.createContext(sandbox);
  script = new vm.Script(code, { filename: filePath });
  script.runInContext(context);

  result = fakeModule.exports;

  return {
    ch: typeof result.char === 'function' ? result.char : null,
    fg: typeof result.fg === 'function' ? result.fg : null,
    bg: typeof result.bg === 'function' ? result.bg : null,
    frame: typeof result.frame === 'function' ? result.frame : null,
    context: context
  };
}

module.exports = loadShader;
