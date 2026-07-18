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

exports.frame = function (grid) {
  var x, y, drop, headY, dist, cell;

  if (drops === null || lastCols !== width) {
    setup(width, height);
  }

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      grid[y][x].ch = ' ';
      grid[y][x].fg = 'default';
    }
  }

  for (x = 0; x < width; x++) {
    drop = drops[x];
    drop.y += drop.speed;

    if (drop.y - TRAIL_LENGTH > height) {
      drop.y = -Math.floor(Math.random() * height);
      drop.speed = 0.3 + Math.random() * 0.7;
    }

    headY = Math.floor(drop.y);

    for (y = 0; y < height; y++) {
      dist = headY - y;

      if (dist < 0 || dist > TRAIL_LENGTH) {
        continue;
      }

      cell = grid[y][x];
      cell.ch = randomChar();
      cell.fg = dist === 0 ? 'brightwhite' : 'green';
    }
  }
};
