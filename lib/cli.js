var fs = require('fs');
var path = require('path');
var render = require('./render');

var EXAMPLES_DIR = path.join(__dirname, '..', 'examples');

function printUsage() {
  var lines = [];

  lines.push('textmode - a platform for text based demos and animated visual experimentation');
  lines.push('');
  lines.push('Usage:');
  lines.push('  textmode run <file> [fps=30] [w=80] [h=25] [seconds=N]');
  lines.push('  textmode list');
  lines.push('  textmode help');
  lines.push('');
  lines.push('Examples:');
  lines.push('  textmode run examples/plasma.js');
  lines.push('  textmode run examples/fire.js fps=24 w=100 h=30');
  lines.push('');
  lines.push('Shader API (see readme.nfo):');
  lines.push('  exports.char  = function (x, y, t, cols, rows) { return "#"; }');
  lines.push('  exports.fg    = function (x, y, t, cols, rows) { return "green"; }');
  lines.push('  exports.bg    = function (x, y, t, cols, rows) { return "default"; }');
  lines.push('  exports.frame = function (buffer, t, cols, rows) { ... }');

  process.stdout.write(lines.join('\n') + '\n');
}

function listExamples() {
  var files = fs.readdirSync(EXAMPLES_DIR);
  var i, lines;

  lines = [];
  lines.push('Bundled examples:');

  for (i = 0; i < files.length; i++) {
    lines.push('  examples/' + files[i]);
  }

  lines.push('');
  lines.push('Run one with: textmode run examples/<name>.js');

  process.stdout.write(lines.join('\n') + '\n');
}

function parseArgs(argv) {
  var options = { command: argv[0], file: null, fps: 30, cols: null, rows: null, seconds: null };
  var i, arg, eq, key, value;

  for (i = 1; i < argv.length; i++) {
    arg = argv[i];
    eq = arg.indexOf('=');

    if (eq === -1) {
      if (options.file === null) {
        options.file = arg;
      }
      continue;
    }

    key = arg.substring(0, eq);
    value = arg.substring(eq + 1);

    if (key === 'fps') {
      options.fps = parseInt(value, 10);
    } else if (key === 'w') {
      options.cols = parseInt(value, 10);
    } else if (key === 'h') {
      options.rows = parseInt(value, 10);
    } else if (key === 'seconds') {
      options.seconds = parseFloat(value);
    }
  }

  return options;
}

function main(argv) {
  var options = parseArgs(argv);
  var filePath;

  if (!options.command || options.command === 'help' || options.command === '--help' || options.command === '-h') {
    printUsage();
    process.exit(0);
    return;
  }

  if (options.command === 'list') {
    listExamples();
    return;
  }

  if (options.command === 'run') {
    if (!options.file) {
      process.stderr.write('Error: missing <file> argument.\n\n');
      printUsage();
      process.exit(1);
      return;
    }

    filePath = path.resolve(process.cwd(), options.file);

    if (!fs.existsSync(filePath)) {
      process.stderr.write('Error: file not found: ' + filePath + '\n');
      process.exit(1);
      return;
    }

    render.run(filePath, options);
    return;
  }

  process.stderr.write('Unknown command: ' + options.command + '\n\n');
  printUsage();
  process.exit(1);
}

module.exports = main;
