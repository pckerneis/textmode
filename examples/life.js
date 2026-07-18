// Conway's Game of Life. Needs to look at each cell's neighbors, so it
// keeps its own grid (wrapped at the edges) and only uses the "frame"
// buffer as an output sink.

var cells = null;
var next = null;
var lastCols = 0;
var lastRows = 0;
var STEP_EVERY_N_FRAMES = 3;

function setup(cols, rows) {
  var x, y;

  cells = [];
  next = [];

  for (y = 0; y < rows; y++) {
    cells.push([]);
    next.push([]);
    for (x = 0; x < cols; x++) {
      cells[y].push(Math.random() < 0.2 ? 1 : 0);
      next[y].push(0);
    }
  }

  lastCols = cols;
  lastRows = rows;
}

function countNeighbors(x, y, cols, rows) {
  var count = 0;
  var dx, dy, nx, ny;

  for (dy = -1; dy <= 1; dy++) {
    for (dx = -1; dx <= 1; dx++) {
      if (dx === 0 && dy === 0) {
        continue;
      }
      nx = (x + dx + cols) % cols;
      ny = (y + dy + rows) % rows;
      count += cells[ny][nx];
    }
  }

  return count;
}

function step(cols, rows) {
  var x, y, alive, neighbors, willLive, tmp;

  for (y = 0; y < rows; y++) {
    for (x = 0; x < cols; x++) {
      alive = cells[y][x];
      neighbors = countNeighbors(x, y, cols, rows);
      willLive = alive ? (neighbors === 2 || neighbors === 3) : (neighbors === 3);
      next[y][x] = willLive ? 1 : 0;
    }
  }

  tmp = cells;
  cells = next;
  next = tmp;
}

exports.frame = function (grid) {
  var x, y, cell;

  if (cells === null || lastCols !== width || lastRows !== height) {
    setup(width, height);
  }

  if (frame % STEP_EVERY_N_FRAMES === 0) {
    step(width, height);
  }

  for (y = 0; y < height; y++) {
    for (x = 0; x < width; x++) {
      cell = grid[y][x];
      if (cells[y][x]) {
        cell.ch = '#';
        cell.fg = 'brightwhite';
      } else {
        cell.ch = ' ';
        cell.fg = 'default';
      }
    }
  }
};
