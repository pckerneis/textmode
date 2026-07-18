// Rendering engine: owns the screen buffer, the animation loop, and
// drawing the buffer to the terminal with ANSI escape codes.

var colors = require('./colors');
var loadShader = require('./loader');

function createBuffer(cols, rows) {
  var buffer = [];
  var x, y, row;

  for (y = 0; y < rows; y++) {
    row = [];
    for (x = 0; x < cols; x++) {
      row.push({ ch: ' ', fg: 'default', bg: 'default' });
    }
    buffer.push(row);
  }

  return buffer;
}

function draw(buffer, cols, rows) {
  var out = '\x1b[H';
  var x, y, cell, lastFg, lastBg;

  for (y = 0; y < rows; y++) {
    lastFg = null;
    lastBg = null;

    for (x = 0; x < cols; x++) {
      cell = buffer[y][x];

      if (cell.fg !== lastFg || cell.bg !== lastBg) {
        out += '\x1b[' + colors.fgCode(cell.fg) + ';' + colors.bgCode(cell.bg) + 'm';
        lastFg = cell.fg;
        lastBg = cell.bg;
      }

      out += cell.ch;
    }

    out += '\x1b[0m';

    if (y < rows - 1) {
      out += '\n';
    }
  }

  process.stdout.write(out);
}

function run(filePath, options) {
  var shader = loadShader(filePath);
  var cols, rows, fps, intervalMs, buffer, startTime, timer, stopTimer, stopped;

  if (!shader.ch && !shader.frame) {
    process.stderr.write('Error: shader must export a "char" function or a "frame" function.\n');
    process.exit(1);
    return;
  }

  cols = options.cols || process.stdout.columns || 80;
  rows = options.rows || process.stdout.rows || 25;
  fps = options.fps || 30;
  intervalMs = Math.floor(1000 / fps);

  buffer = createBuffer(cols, rows);
  startTime = Date.now();
  stopTimer = null;
  stopped = false;

  function cleanup() {
    if (stopped) {
      return;
    }
    stopped = true;
    clearInterval(timer);
    if (stopTimer) {
      clearTimeout(stopTimer);
    }
    process.stdout.write('\x1b[0m\x1b[?25h\n');
    process.exit(0);
  }

  process.on('SIGINT', cleanup);

  process.stdout.write('\x1b[?25l'); // hide cursor
  process.stdout.write('\x1b[2J');   // clear screen once, up front

  timer = setInterval(function () {
    var t = (Date.now() - startTime) / 1000;
    var x, y, cell, chValue, fgValue, bgValue;

    if (shader.frame) {
      shader.frame(buffer, t, cols, rows);
    } else {
      for (y = 0; y < rows; y++) {
        for (x = 0; x < cols; x++) {
          cell = buffer[y][x];
          chValue = shader.ch(x, y, t, cols, rows);
          fgValue = shader.fg ? shader.fg(x, y, t, cols, rows) : 'default';
          bgValue = shader.bg ? shader.bg(x, y, t, cols, rows) : 'default';
          cell.ch = chValue ? String(chValue).charAt(0) : ' ';
          cell.fg = (fgValue === undefined || fgValue === null || fgValue === '') ? 'default' : fgValue;
          cell.bg = (bgValue === undefined || bgValue === null || bgValue === '') ? 'default' : bgValue;
        }
      }
    }

    draw(buffer, cols, rows);
  }, intervalMs);

  if (options.seconds) {
    stopTimer = setTimeout(cleanup, options.seconds * 1000);
  }
}

module.exports = {
  run: run,
  createBuffer: createBuffer,
  draw: draw
};
