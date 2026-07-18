// Matrix-style digital rain. Uses the "frame" style since each column
// needs to remember its own drop position and speed between frames -
// state that a stateless per-cell char()/fg() pair can't hold on its own.

var CHARS = '01ABCDEFGHIJKLMNOPQRSTUVWXYZ';
var TRAIL_LENGTH = 12;

var drops = null;
var lastCols = 0;

function randomChar() {
  var index = Math.floor(Math.random() * CHARS.length);
  return CHARS.charAt(index);
}

function setup(cols, rows) {
  var i;

  drops = [];

  for (i = 0; i < cols; i++) {
    drops.push({
      y: -Math.floor(Math.random() * rows),
      speed: 0.3 + Math.random() * 0.7
    });
  }

  lastCols = cols;
}

function frame(buffer, t, cols, rows) {
  var x, y, drop, headY, dist, cell;

  if (drops === null || lastCols !== cols) {
    setup(cols, rows);
  }

  for (y = 0; y < rows; y++) {
    for (x = 0; x < cols; x++) {
      buffer[y][x].ch = ' ';
      buffer[y][x].fg = 'default';
    }
  }

  for (x = 0; x < cols; x++) {
    drop = drops[x];
    drop.y += drop.speed;

    if (drop.y - TRAIL_LENGTH > rows) {
      drop.y = -Math.floor(Math.random() * rows);
      drop.speed = 0.3 + Math.random() * 0.7;
    }

    headY = Math.floor(drop.y);

    for (y = 0; y < rows; y++) {
      dist = headY - y;

      if (dist < 0 || dist > TRAIL_LENGTH) {
        continue;
      }

      cell = buffer[y][x];
      cell.ch = randomChar();
      cell.fg = dist === 0 ? 'brightwhite' : 'green';
    }
  }
}

exports.frame = frame;
